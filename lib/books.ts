import type { DocumentData } from 'firebase/firestore';

import type { Book } from '@/types/book';

export function bookFromDoc(id: string, data: DocumentData): Book {
  return {
    id,
    title: data.title,
    author: data.author,
    coverUrl: data.coverUrl ?? null,
    genre: data.genre,
    condition: data.condition,
    description: data.description,
    isbn: data.isbn ?? null,
    ownerId: data.ownerId,
    ownerName: data.ownerName,
    location: data.location ?? null,
    available: data.available,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
  };
}
