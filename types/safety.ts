/** Must match the list in firestore.rules (reports create rule). */
export const REPORT_REASONS = ['Spam', 'Inappropriate behaviour', 'Unsafe meetup', 'Other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportSource = 'profile' | 'chat';

/** Must match the note size limit in firestore.rules. */
export const REPORT_NOTE_MAX = 1000;

export const BLOCK_EXPLANATION =
  'They won’t be able to send you borrow requests or messages, and you won’t be able to contact them either. ' +
  'Their books will be hidden from you, and you’ll stop following them. ' +
  'They aren’t told you blocked them. Your past chats stay readable, and a book that’s already lent out can still be marked as returned. ' +
  'You can unblock them any time from Account › Blocked users.';
