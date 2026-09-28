import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { requireDb } from '@/lib/firebase';
import type { BorrowRequest } from '@/types/request';
import type { Review, ReviewBucket, ReviewGroup, ReviewRole } from '@/types/review';

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
    revieweeRole: data.revieweeRole === 'borrower' || data.revieweeRole === 'lender' ? data.revieweeRole : null,
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

function groupOf(reviews: Review[]): ReviewGroup {
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return { reviews, count: reviews.length, averageRating: reviews.length ? total / reviews.length : 0 };
}

/**
 * Every review a user has received, split by the role they played. Computed
 * on the client from the reviews themselves, so it's accurate even though the
 * users/{uid} aggregates (reviewCount/averageRating) need Cloud Functions.
 */
export function useReviewsReceived(uid: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setReviews([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      query(collection(requireDb(), 'reviews'), where('revieweeId', '==', uid)),
      (snapshot) => {
        setReviews(
          snapshot.docs.map((d) => reviewFromDoc(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt)
        );
        setLoading(false);
      },
      (error) => {
        console.warn('useReviewsReceived listener failed', error);
        setLoading(false);
      }
    );
  }, [uid]);

  const groups = useMemo<Record<ReviewBucket, ReviewGroup>>(
    () => ({
      borrower: groupOf(reviews.filter((r) => r.revieweeRole === 'borrower')),
      lender: groupOf(reviews.filter((r) => r.revieweeRole === 'lender')),
      other: groupOf(reviews.filter((r) => r.revieweeRole === null)),
    }),
    [reviews]
  );

  return { reviews, groups, all: groupOf(reviews), loading };
}

export function useSubmitReview() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');

  const submitReview = useCallback(
    async (request: BorrowRequest, revieweeId: string, rating: number, comment: string) => {
      if (!user || !profile) throw new Error('Must be signed in to leave a review');
      // Rules verify this against the request, so it can't be misattributed.
      const revieweeRole: ReviewRole = revieweeId === request.borrowerId ? 'borrower' : 'lender';
      setStatus('submitting');
      try {
        await addDoc(collection(requireDb(), 'reviews'), {
          requestId: request.id,
          bookId: request.bookId,
          bookTitle: request.bookTitle,
          reviewerId: user.uid,
          reviewerName: profile.displayName,
          revieweeId,
          revieweeRole,
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
