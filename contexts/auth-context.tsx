import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { userProfileFromDoc } from '@/lib/users';
import type { GeoPoint } from '@/types/geo';
import type { UserProfile } from '@/types/user';

/** Why `profile` is null (or not): lets screens show something better than a permanent "Loading…". */
export type ProfileStatus = 'loading' | 'ready' | 'creating' | 'error';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  profileStatus: ProfileStatus;
  profileError: string | null;
  initializing: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateLocation: (location: GeoPoint) => Promise<void>;
  /**
   * Deletes the Firebase Auth user. The onAuthUserDeleted Cloud Function then
   * removes their profile, books and follows and renames their messages,
   * reviews and requests to "Deleted user". Throws RecentLoginRequiredError
   * if Firebase wants a fresh sign-in first (nothing is deleted in that case).
   */
  deleteAccount: () => Promise<void>;
};

export class RecentLoginRequiredError extends Error {
  constructor() {
    super('Please sign in again before deleting your account.');
    this.name = 'RecentLoginRequiredError';
  }
}

/** ~1.1 km precision: enough for "2 km away", too coarse to locate a home. */
function approximate(location: GeoPoint): GeoPoint {
  const round = (n: number) => Math.round(n * 100) / 100;
  return { latitude: round(location.latitude), longitude: round(location.longitude) };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function requireFirebase() {
  if (!auth || !db) throw new Error('Firebase is not configured — see .env.example');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(isFirebaseConfigured);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading');
  const [profileError, setProfileError] = useState<string | null>(null);
  // signUp writes the profile doc itself (with the chosen display name); the
  // listener must not race it by creating a fallback doc in the meantime.
  const signingUp = useRef(false);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setProfile(null);
      setProfileStatus('loading');
      setProfileError(null);
      return;
    }
    setProfileStatus('loading');
    setProfileError(null);
    const profileRef = doc(db, 'users', user.uid);
    let createAttempted = false;
    return onSnapshot(
      profileRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!snapshot.exists()) {
          setProfile(null);
          // A cache miss isn't proof the doc is missing — wait for the server.
          if (snapshot.metadata.fromCache || signingUp.current) return;
          if (createAttempted) return;
          // Accounts whose sign-up profile write never landed have no users/{uid}
          // doc, so the profile would stay null forever. Recreate it with the
          // zeroed stats the rules require; the listener then picks it up.
          createAttempted = true;
          setProfileStatus('creating');
          console.warn(`users/${user.uid} is missing — recreating profile doc`);
          setDoc(profileRef, {
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName || user.email?.split('@')[0] || 'Reader',
            location: null,
            createdAt: serverTimestamp(),
            trustScore: 0,
            completedReturns: 0,
            reviewCount: 0,
            averageRating: 0,
          }).catch((error) => {
            console.warn('Recreating profile doc failed', error);
            setProfileStatus('error');
            setProfileError(error instanceof Error ? error.message : String(error));
          });
          return;
        }
        setProfileStatus('ready');
        setProfileError(null);
        setProfile(userProfileFromDoc(snapshot.data()));
      },
      (error) => {
        console.warn(`Profile listener for users/${user.uid} failed`, error);
        setProfile(null);
        setProfileStatus('error');
        setProfileError(error.message);
      }
    );
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      profileStatus,
      profileError,
      initializing,
      signUp: async (email, password, displayName) => {
        requireFirebase();
        signingUp.current = true;
        try {
          const credential = await createUserWithEmailAndPassword(auth!, email, password);
          await updateProfile(credential.user, { displayName });
          await setDoc(doc(db!, 'users', credential.user.uid), {
            uid: credential.user.uid,
            email,
            displayName,
            location: null,
            createdAt: serverTimestamp(),
            trustScore: 0,
            completedReturns: 0,
            reviewCount: 0,
            averageRating: 0,
          });
        } finally {
          signingUp.current = false;
        }
      },
      signIn: async (email, password) => {
        requireFirebase();
        await signInWithEmailAndPassword(auth!, email, password);
      },
      signOut: () => {
        requireFirebase();
        return firebaseSignOut(auth!);
      },
      updateLocation: async (location) => {
        requireFirebase();
        if (!user) throw new Error('Not signed in');
        // Profiles are readable by every signed-in user, so only store a
        // rounded position (the Privacy Policy promises approximate location).
        await updateDoc(doc(db!, 'users', user.uid), { location: approximate(location) });
      },
      deleteAccount: async () => {
        requireFirebase();
        const current = auth!.currentUser;
        if (!current) throw new Error('Not signed in');
        try {
          await deleteUser(current);
        } catch (error) {
          if (error instanceof FirebaseError && error.code === 'auth/requires-recent-login') {
            throw new RecentLoginRequiredError();
          }
          throw error;
        }
      },
    }),
    [user, profile, profileStatus, profileError, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
