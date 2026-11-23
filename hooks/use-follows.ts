import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { requireDb } from '@/lib/firebase';
import { followDocId, followFromDoc } from '@/lib/follows';
import type { Follow } from '@/types/follow';

/** Live list of follow docs where `field` is `uid` (followerId → following, followeeId → followers). */
function useFollowList(field: 'followerId' | 'followeeId', uid: string | undefined) {
  const [follows, setFollows] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setFollows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      query(collection(requireDb(), 'follows'), where(field, '==', uid)),
      (snapshot) => {
        setFollows(
          snapshot.docs.map((d) => followFromDoc(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt)
        );
        setLoading(false);
      },
      (error) => {
        console.warn(`follows (${field}) listener failed`, error);
        setLoading(false);
      }
    );
  }, [field, uid]);

  return { follows, loading };
}

/** People `uid` follows. */
export function useFollowing(uid: string | undefined) {
  return useFollowList('followerId', uid);
}

/** People following `uid`. */
export function useFollowers(uid: string | undefined) {
  return useFollowList('followeeId', uid);
}

/** Whether the signed-in user follows `targetUid` (single doc read via the deterministic id). */
export function useIsFollowing(targetUid: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !targetUid || user.uid === targetUid) {
      setIsFollowing(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      doc(requireDb(), 'follows', followDocId(user.uid, targetUid)),
      (snapshot) => {
        setIsFollowing(snapshot.exists());
        setLoading(false);
      },
      (error) => {
        console.warn('useIsFollowing listener failed', error);
        setLoading(false);
      }
    );
  }, [user, targetUid]);

  return { isFollowing, loading };
}

export function useFollowActions() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');

  const run = useCallback(async (action: () => Promise<void>) => {
    setStatus('submitting');
    try {
      await action();
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      throw error;
    }
  }, []);

  const follow = useCallback(
    (target: { uid: string; displayName: string }) =>
      run(async () => {
        if (!user) throw new Error('Must be signed in to follow someone');
        if (target.uid === user.uid) throw new Error("You can't follow yourself");
        await setDoc(doc(requireDb(), 'follows', followDocId(user.uid, target.uid)), {
          followerId: user.uid,
          followerName: profile?.displayName ?? user.displayName ?? 'Reader',
          followeeId: target.uid,
          followeeName: target.displayName,
          createdAt: serverTimestamp(),
        });
      }),
    [run, user, profile]
  );

  const unfollow = useCallback(
    (targetUid: string) =>
      run(async () => {
        if (!user) throw new Error('Must be signed in to unfollow someone');
        await deleteDoc(doc(requireDb(), 'follows', followDocId(user.uid, targetUid)));
      }),
    [run, user]
  );

  return { status, follow, unfollow };
}
