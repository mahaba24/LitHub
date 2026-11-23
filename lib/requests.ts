import type { DocumentData } from 'firebase/firestore';

import { dueDateMillisFromFirestore } from '@/lib/dates';
import type { BorrowRequest } from '@/types/request';

/** True when the next move on a request is `uid`'s (drives the pending badge). */
export function requestNeedsActionFrom(request: BorrowRequest, uid: string): boolean {
  // A fresh request is waiting on the lender to respond.
  if (request.status === 'Requested') return request.lenderId === uid;
  // A proposal is waiting on whoever didn't make it.
  if (request.status === 'Under Negotiation') {
    return request.lastProposedBy !== null && request.lastProposedBy !== uid;
  }
  return false;
}

export function requestFromDoc(id: string, data: DocumentData): BorrowRequest {
  return {
    id,
    bookId: data.bookId,
    bookTitle: data.bookTitle,
    borrowerId: data.borrowerId,
    borrowerName: data.borrowerName,
    lenderId: data.lenderId,
    lenderName: data.lenderName,
    status: data.status,
    proposedDueDate: dueDateMillisFromFirestore(data.proposedDueDate),
    lastProposedBy: data.lastProposedBy ?? null,
    damageSeverity: data.damageSeverity ?? 'None',
    damageFee: data.damageFee ?? null,
    damageReportedAt: data.damageReportedAt?.toMillis?.() ?? null,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),
  };
}