import type { GeoPoint } from '@/types/geo';

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  location: GeoPoint | null;
  createdAt: number;
  // Maintained server-side only, by the recalculateTrustScore Cloud
  // Function — never written directly by the client.
  trustScore: number;
  completedReturns: number;
  reviewCount: number;
  averageRating: number;
};
