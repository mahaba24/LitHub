export type RequestStatus = 'Requested' | 'Under Negotiation' | 'Confirmed' | 'Completed' | 'Overdue';

export type DamageSeverity = 'None' | 'Minor' | 'Moderate' | 'Severe';

export const DAMAGE_FEES: Record<Exclude<DamageSeverity, 'None'>, number> = {
  Minor: 5,
  Moderate: 15,
  Severe: 30,
};

export type BorrowRequest = {
  id: string;
  bookId: string;
  bookTitle: string;
  borrowerId: string;
  borrowerName: string;
  lenderId: string;
  lenderName: string;
  status: RequestStatus;
  proposedDueDate: string | null;
  damageSeverity: DamageSeverity;
  damageFee: number | null;
  damageReportedAt: number | null;
  createdAt: number;
  updatedAt: number;
};