import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { requireDb } from '@/lib/firebase';
import { userProfileFromDoc } from '@/lib/users';
import type { UserProfile } from '@/types/user';

/** Any user's public profile doc (users/* is readable by every signed-in user). */
export function useUserProfile(uid: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      doc(requireDb(), 'users', uid),
      (snapshot) => {
        setProfile(snapshot.exists() ? userProfileFromDoc({ uid, ...snapshot.data() }) : null);
        setLoading(false);
      },
      (error) => {
        console.warn('useUserProfile listener failed', error);
        setLoading(false);
      }
    );
  }, [uid]);

  return { profile, loading };
}
