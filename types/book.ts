import type { GeoPoint } from '@/types/geo';

export type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  genre: string;
  condition: string;
  description: string;
  isbn: string | null;
  ownerId: string;
  ownerName: string;
  location: GeoPoint | null;
  available: boolean;
  createdAt: number;
};

export type BookDraft = Omit<Book, 'id' | 'ownerId' | 'ownerName' | 'location' | 'createdAt'>;
