import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
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
