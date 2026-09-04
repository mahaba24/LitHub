import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { requireDb } from '@/lib/firebase';
import type { BookDraft } from '@/types/book';

export type BookMutationStatus = 'idle' | 'saving' | 'error';

export function useBookMutations() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<BookMutationStatus>('idle');

  const createBook = useCallback(
    async (draft: BookDraft) => {
      if (!user || !profile) throw new Error('Must be signed in to list a book');
      setStatus('saving');
      try {
        const ref = await addDoc(collection(requireDb(), 'books'), {
          ...draft,
          ownerId: user.uid,
          ownerName: profile.displayName,
          location: profile.location ?? null,
          createdAt: serverTimestamp(),
        });
        setStatus('idle');
        return ref.id;
      } catch (error) {
        setStatus('error');
        throw error;
      }
    },
    [user, profile]
  );

  const updateBook = useCallback(async (id: string, draft: Partial<BookDraft>) => {
    setStatus('saving');
    try {
      await updateDoc(doc(requireDb(), 'books', id), draft);
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      throw error;
    }
  }, []);

  const deleteBook = useCallback(async (id: string) => {
    setStatus('saving');
    try {
      await deleteDoc(doc(requireDb(), 'books', id));
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      throw error;
    }
  }, []);

  return { status, createBook, updateBook, deleteBook };
}
