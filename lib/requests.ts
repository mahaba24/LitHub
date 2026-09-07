import type { DocumentData } from 'firebase/firestore';

import type { BorrowRequest } from '@/types/request';

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
    proposedDueDate: data.proposedDueDate ?? null,
    damageSeverity: data.damageSeverity ?? 'None',
    damageFee: data.damageFee ?? null,
    damageReportedAt: data.damageReportedAt?.toMillis?.() ?? null,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    updatedAt: data.updatedAt?.toMillis?.() ?? Date.now(),
  };
}