import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';

import { computeTrustScore } from './trust-score';

initializeApp();
const db = getFirestore();

/**
 * Fires on every write to a request, but only acts the moment status
 * transitions into 'Completed' — both parties just finished a successful
 * exchange, so both get a completedReturns credit and a recalculated score.
 */
export const onRequestWritten = onDocumentUpdated('requests/{requestId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;

  const becameCompleted = before.status !== 'Completed' && after.status === 'Completed';
  if (!becameCompleted) return;

  const userIds = Array.from(new Set([after.borrowerId, after.lenderId].filter(Boolean)));

  await Promise.all(
    userIds.map((uid: string) =>
      // A transaction guards against two requests completing for the same
      // user at nearly the same time and clobbering each other's increment.
      db.runTransaction(async (tx) => {
        const userRef = db.collection('users').doc(uid);
        const snap = await tx.get(userRef);
        if (!snap.exists) return;

        const data = snap.data() ?? {};
        const completedReturns = (data.completedReturns ?? 0) + 1;
        const averageRating = data.averageRating ?? 0;
        const trustScore = computeTrustScore({ completedReturns, averageRating });

        tx.update(userRef, { completedReturns, trustScore });
      })
    )
  );
});

/**
 * Reviews are immutable (create-only), so this only needs an onCreate
 * handler — no update/delete case to reconcile.
 */
export const onReviewCreated = onDocumentCreated('reviews/{reviewId}', async (event) => {
  const review = event.data?.data();
  if (!review) return;

  const revieweeId = review.revieweeId as string | undefined;
  const rating = review.rating as number | undefined;
  if (!revieweeId || typeof rating !== 'number') return;

  // Same race-condition guard as above: two reviews landing for the same
  // user around the same time must not overwrite each other's average.
  await db.runTransaction(async (tx) => {
    const userRef = db.collection('users').doc(revieweeId);
    const snap = await tx.get(userRef);
    if (!snap.exists) return;

    const data = snap.data() ?? {};
    const oldCount = data.reviewCount ?? 0;
    const oldAverage = data.averageRating ?? 0;
    const newCount = oldCount + 1;
    const newAverage = (oldAverage * oldCount + rating) / newCount;
    const completedReturns = data.completedReturns ?? 0;
    const trustScore = computeTrustScore({ completedReturns, averageRating: newAverage });

    tx.update(userRef, { reviewCount: newCount, averageRating: newAverage, trustScore });
  });
});
