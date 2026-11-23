/** The role the *reviewee* played in the exchange being reviewed. */
export type ReviewRole = 'borrower' | 'lender';

export type Review = {
  id: string;
  requestId: string;
  bookId: string;
  bookTitle: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  /** null for reviews written before roles were recorded — shown under "Other". */
  revieweeRole: ReviewRole | null;
  rating: number;
  comment: string;
  createdAt: number;
};

export type ReviewBucket = 'borrower' | 'lender' | 'other';

export type ReviewGroup = {
  reviews: Review[];
  count: number;
  /** 0 when there are no reviews. */
  averageRating: number;
};
