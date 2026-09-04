export type RequestStatus = 'Requested' | 'Under Negotiation' | 'Confirmed' | 'Completed' | 'Overdue';

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
  createdAt: number;
  updatedAt: number;
};
