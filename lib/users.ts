import type { DocumentData } from 'firebase/firestore';

import type { UserProfile } from '@/types/user';

export function userProfileFromDoc(data: DocumentData): UserProfile {
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    location: data.location ?? null,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
    trustScore: data.trustScore ?? 0,
    completedReturns: data.completedReturns ?? 0,
    reviewCount: data.reviewCount ?? 0,
    averageRating: data.averageRating ?? 0,
  };
}
