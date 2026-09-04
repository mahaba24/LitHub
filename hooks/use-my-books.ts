import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { bookFromDoc } from '@/lib/books';
import { requireDb } from '@/lib/firebase';
import type { Book } from '@/types/book';

export function useMyBooks() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBooks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const myBooksQuery = query(collection(requireDb(), 'books'), where('ownerId', '==', user.uid));
    return onSnapshot(myBooksQuery, (snapshot) => {
      setBooks(snapshot.docs.map((d) => bookFromDoc(d.id, d.data())));
      setLoading(false);
    });
  }, [user]);

  return { books, loading };
}
