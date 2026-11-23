import { FirebaseError } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { requireDb } from '@/lib/firebase';
import { followDocId } from '@/lib/follows';
import type { ReportReason, ReportSource } from '@/types/safety';

/**
 * Live list of uids the signed-in user has blocked (users/{me}/blocks).
 * Blocks are two-way in firestore.rules: neither side can start requests,
 * negotiate or message. Hiding their books is done client-side by callers.
 */
export function useBlockedIds() {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIds([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      collection(requireDb(), 'users', user.uid, 'blocks'),
      (snapshot) => {
        setIds(snapshot.docs.map((d) => d.id));
        setLoading(false);
      },
      (error) => {
        console.warn('blocks listener failed', error);
        setLoading(false);
      }
    );
  }, [user]);

  const blockedIds = useMemo(() => new Set(ids), [ids]);
  return { blockedIds, loading };
}

export type BlockedUser = { uid: string; displayName: string };

/** Blocked users with display names, for the Blocked users screen. */
export function useBlockedUsers() {
  const { blockedIds, loading: idsLoading } = useBlockedIds();
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const key = [...blockedIds].sort().join(',');

  useEffect(() => {
    if (idsLoading) return;
    let cancelled = false;
    const ids = key ? key.split(',') : [];
    setLoading(true);
    Promise.all(
      ids.map(async (uid) => {
        const snap = await getDoc(doc(requireDb(), 'users', uid)).catch(() => null);
        return { uid, displayName: snap?.exists() ? (snap.data().displayName as string) : 'Deleted user' };
      })
    ).then((result) => {
      if (cancelled) return;
      setUsers(result.sort((a, b) => a.displayName.localeCompare(b.displayName)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [key, idsLoading]);

  return { users, loading: idsLoading || loading };
}

export function useBlockActions() {
  const { user } = useAuth();
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

  /** Blocks `targetUid` and, in the same batch, removes MY follow of them. */
  const block = useCallback(
    (targetUid: string) =>
      run(async () => {
        if (!user) throw new Error('Must be signed in to block someone');
        if (targetUid === user.uid) throw new Error("You can't block yourself");
        const db = requireDb();
        const followRef = doc(db, 'follows', followDocId(user.uid, targetUid));
        // The follow delete rule needs an existing doc, so only include it
        // when I actually follow them. Their follow of me is left alone.
        const followSnap = await getDoc(followRef);
        const batch = writeBatch(db);
        batch.set(doc(db, 'users', user.uid, 'blocks', targetUid), {
          blockedUid: targetUid,
          createdAt: serverTimestamp(),
        });
        if (followSnap.exists()) batch.delete(followRef);
        await batch.commit();
      }),
    [run, user]
  );

  const unblock = useCallback(
    (targetUid: string) =>
      run(async () => {
        if (!user) throw new Error('Must be signed in to unblock someone');
        await deleteDoc(doc(requireDb(), 'users', user.uid, 'blocks', targetUid));
      }),
    [run, user]
  );

  return { status, block, unblock };
}

export type ReportInput = {
  reportedUserId: string;
  reason: ReportReason;
  note?: string;
  source: ReportSource;
  /** Required when source is 'chat'. */
  requestId?: string;
};

/** Files a report. Reports are write-only: nobody can read them from the app. */
export function useReportUser() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');

  const submitReport = useCallback(
    async ({ reportedUserId, reason, note, source, requestId }: ReportInput) => {
      if (!user) throw new Error('Must be signed in to report someone');
      setStatus('submitting');
      try {
        const trimmed = note?.trim();
        await addDoc(collection(requireDb(), 'reports'), {
          reporterId: user.uid,
          reportedUserId,
          reason,
          source,
          ...(trimmed ? { note: trimmed } : {}),
          ...(source === 'chat' && requestId ? { requestId } : {}),
          createdAt: serverTimestamp(),
        });
        setStatus('idle');
      } catch (error) {
        setStatus('error');
        throw error;
      }
    },
    [user]
  );

  return { status, submitReport };
}

/** True for the error the rules return when a block (either way) stops a write. */
export function isPermissionDenied(error: unknown) {
  return error instanceof FirebaseError && error.code === 'permission-denied';
}
