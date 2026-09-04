import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import type { GeoPoint } from '@/types/geo';
import type { UserProfile } from '@/types/user';

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  initializing: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateLocation: (location: GeoPoint) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function requireFirebase() {
  if (!auth || !db) throw new Error('Firebase is not configured — see .env.example');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(isFirebaseConfigured);

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
      return;
    }
    return onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (!snapshot.exists()) {
        setProfile(null);
        return;
      }
      const data = snapshot.data();
      setProfile({
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        location: data.location ?? null,
        createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        trustScore: data.trustScore ?? 0,
        completedReturns: data.completedReturns ?? 0,
        reviewCount: data.reviewCount ?? 0,
        averageRating: data.averageRating ?? 0,
      });
    });
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      initializing,
      signUp: async (email, password, displayName) => {
        requireFirebase();
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
        await updateDoc(doc(db!, 'users', user.uid), { location });
      },
    }),
    [user, profile, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
