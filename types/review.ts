export type Review = {
  id: string;
  requestId: string;
  bookId: string;
  bookTitle: string;
  reviewerId: string;
  reviewerName: string;
  revieweeId: string;
  rating: number;
  comment: string;
  createdAt: number;
};
