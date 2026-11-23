import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import * as functionsV1 from 'firebase-functions/v1';
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
 * Book of the Month tally. Clients can't read other people's requests, so the
 * leaderboard reads public per-book counters instead, and only this trigger
 * writes them (firestore.rules denies all client writes).
 *
 * Doc id: `{YYYY-MM}_{bookId}` (UTC month of the server event time, never a
 * client-supplied timestamp). Each borrower counts once per book per month:
 * a private marker doc `counted/{borrowerId}` is checked in the same
 * transaction, which also makes duplicate trigger deliveries harmless.
 */
export const onRequestCreatedCountBook = onDocumentCreated('requests/{requestId}', async (event) => {
  const req = event.data?.data();
  const bookId = req?.bookId;
  const borrowerId = req?.borrowerId;
  if (typeof bookId !== 'string' || typeof borrowerId !== 'string') return;

  const month = monthKey(new Date(event.time));
  const counterRef = db.collection('monthlyBookCounts').doc(`${month}_${bookId}`);
  const markerRef = counterRef.collection('counted').doc(borrowerId);

  await db.runTransaction(async (tx) => {
    const [counterSnap, markerSnap] = await Promise.all([tx.get(counterRef), tx.get(markerRef)]);
    if (markerSnap.exists) return;
    const count = (counterSnap.data()?.count ?? 0) + 1;
    tx.set(counterRef, { month, bookId, count, updatedAt: FieldValue.serverTimestamp() });
    tx.set(markerRef, { countedAt: FieldValue.serverTimestamp() });
  });
});

/** UTC `YYYY-MM`. The client computes the same key in hooks/use-leaderboard.ts. */
function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

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

const DELETED_USER_NAME = 'Deleted user';

/**
 * Account deletion cleanup. The app only calls Firebase Auth deleteUser();
 * everything else happens here with the Admin SDK, so a "requires recent
 * login" failure leaves the account fully intact, and clients never need
 * write access to other people's messages/reviews.
 *
 * Deletes: users/{uid} and its blocks subcollection, the user's books, and
 * follow records in either direction. Reports (by or about them) are kept
 * for safety review; blocks other people hold against them are left alone. Keeps (renamed to "Deleted user"): messages they sent, reviews
 * they wrote, and requests they were part of, so the other party's history
 * still makes sense.
 */
export const onAuthUserDeleted = functionsV1.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  const writer = db.bulkWriter();

  const [blocks, books, following, followers, messages, reviews, asBorrower, asLender] = await Promise.all([
    db.collection('users').doc(uid).collection('blocks').get(),
    db.collection('books').where('ownerId', '==', uid).get(),
    db.collection('follows').where('followerId', '==', uid).get(),
    db.collection('follows').where('followeeId', '==', uid).get(),
    db.collectionGroup('messages').where('senderId', '==', uid).get(),
    db.collection('reviews').where('reviewerId', '==', uid).get(),
    db.collection('requests').where('borrowerId', '==', uid).get(),
    db.collection('requests').where('lenderId', '==', uid).get(),
  ]);

  writer.delete(db.collection('users').doc(uid));
  for (const d of [...blocks.docs, ...books.docs, ...following.docs, ...followers.docs]) writer.delete(d.ref);
  for (const d of messages.docs) writer.update(d.ref, { senderName: DELETED_USER_NAME });
  for (const d of reviews.docs) writer.update(d.ref, { reviewerName: DELETED_USER_NAME });
  for (const d of asBorrower.docs) writer.update(d.ref, { borrowerName: DELETED_USER_NAME });
  for (const d of asLender.docs) writer.update(d.ref, { lenderName: DELETED_USER_NAME });

  await writer.close();
});
