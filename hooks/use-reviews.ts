import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { requireDb } from '@/lib/firebase';
import type { BorrowRequest } from '@/types/request';
import type { Review } from '@/types/review';

function reviewFromDoc(id: string, data: Record<string, unknown>): Review {
  const createdAt = data.createdAt as { toMillis?: () => number } | undefined;
  return {
    id,
    requestId: data.requestId as string,
    bookId: data.bookId as string,
    bookTitle: data.bookTitle as string,
    reviewerId: data.reviewerId as string,
    reviewerName: data.reviewerName as string,
    revieweeId: data.revieweeId as string,
    rating: data.rating as number,
    comment: data.comment as string,
    createdAt: createdAt?.toMillis?.() ?? Date.now(),
  };
}

/** The current reviewer's review for a given request, if they've already left one. */
export function useReviewForRequest(requestId: string | undefined, reviewerId: string | undefined) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId || !reviewerId) {
      setReview(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const reviewQuery = query(
      collection(requireDb(), 'reviews'),
      where('requestId', '==', requestId),
      where('reviewerId', '==', reviewerId)
    );
    return onSnapshot(reviewQuery, (snapshot) => {
      const first = snapshot.docs[0];
      setReview(first ? reviewFromDoc(first.id, first.data()) : null);
      setLoading(false);
    });
  }, [requestId, reviewerId]);

  return { review, loading };
}

export function useSubmitReview() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');

  const submitReview = useCallback(
    async (request: BorrowRequest, revieweeId: string, rating: number, comment: string) => {
      if (!user || !profile) throw new Error('Must be signed in to leave a review');
      setStatus('submitting');
      try {
        await addDoc(collection(requireDb(), 'reviews'), {
          requestId: request.id,
          bookId: request.bookId,
          bookTitle: request.bookTitle,
          reviewerId: user.uid,
          reviewerName: profile.displayName,
          revieweeId,
          rating,
          comment,
          createdAt: serverTimestamp(),
        });
        setStatus('idle');
      } catch (error) {
        setStatus('error');
        throw error;
      }
    },
    [user, profile]
  );

  return { status, submitReview };
}
