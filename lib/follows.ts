import type { DocumentData } from 'firebase/firestore';

import type { Follow } from '@/types/follow';

/** Deterministic id: makes double-follows impossible and unfollow a single delete. */
export function followDocId(followerId: string, followeeId: string) {
  return `${followerId}_${followeeId}`;
}

export function followFromDoc(id: string, data: DocumentData): Follow {
  return {
    id,
    followerId: data.followerId,
    followerName: data.followerName,
    followeeId: data.followeeId,
    followeeName: data.followeeName,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
  };
}
