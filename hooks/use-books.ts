import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { bookFromDoc } from '@/lib/books';
import { requireDb } from '@/lib/firebase';
import type { Book } from '@/types/book';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const booksQuery = query(collection(requireDb(), 'books'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      booksQuery,
      (snapshot) => {
        setBooks(snapshot.docs.map((d) => bookFromDoc(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
  }, []);

  return { books, loading, error };
}

export function useBook(id: string | undefined) {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setBook(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(doc(requireDb(), 'books', id), (snapshot) => {
      setBook(snapshot.exists() ? bookFromDoc(snapshot.id, snapshot.data()) : null);
      setLoading(false);
    });
  }, [id]);

  return { book, loading };
}

/** Every book listed by `ownerId` (any user's shelf, not just your own). */
export function useBooksByOwner(ownerId: string | undefined) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setBooks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      query(collection(requireDb(), 'books'), where('ownerId', '==', ownerId)),
      (snapshot) => {
        setBooks(snapshot.docs.map((d) => bookFromDoc(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt));
        setLoading(false);
      },
      (error) => {
        console.warn('useBooksByOwner listener failed', error);
        setLoading(false);
      }
    );
  }, [ownerId]);

  return { books, loading };
}

// Firestore caps `in` filters at 30 values.
const IN_QUERY_LIMIT = 30;

/**
 * Newest available books from the given owners (people you follow). One
 * listener per 30 owners; needs the books (ownerId, createdAt desc) index.
 */
export function useBooksFromOwners(ownerIds: string[], maxResults = 20) {
  const [booksByChunk, setBooksByChunk] = useState<Record<number, Book[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Callers build a new array each render; key the effect on its contents.
  const idsKey = [...ownerIds].sort().join(',');

  useEffect(() => {
    setBooksByChunk({});
    setError(null);
    if (!idsKey) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const ids = idsKey.split(',');
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += IN_QUERY_LIMIT) chunks.push(ids.slice(i, i + IN_QUERY_LIMIT));

    const unsubs = chunks.map((chunk, index) =>
      onSnapshot(
        query(
          collection(requireDb(), 'books'),
          where('ownerId', 'in', chunk),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        ),
        (snapshot) => {
          setBooksByChunk((prev) => ({ ...prev, [index]: snapshot.docs.map((d) => bookFromDoc(d.id, d.data())) }));
          setLoading(false);
        },
        (err) => {
          // failed-precondition here means the composite index isn't deployed yet.
          console.warn('useBooksFromOwners listener failed', err);
          setError(err.message);
          setLoading(false);
        }
      )
    );
    return () => unsubs.forEach((unsub) => unsub());
  }, [idsKey, maxResults]);

  const books = Object.values(booksByChunk)
    .flat()
    .filter((book) => book.available)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, maxResults);

  return { books, loading, error };
}
