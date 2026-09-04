import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
// firebase/auth's "types" export condition always resolves to the non-RN
// d.ts, even though Metro bundles the real React Native build that exports
// this function — the import is valid at runtime, tsc just can't see it.
// @ts-expect-error — getReactNativePersistence exists in the RN build's types, not the resolved d.ts
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// getAuth() validates apiKey eagerly (throws synchronously on web) unlike
// initializeApp/getFirestore, so without this the whole app would crash at
// import time whenever .env hasn't been filled in yet.
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

  // initializeAuth throws if called twice (e.g. Fast Refresh on native), so
  // fall back to the already-initialized instance instead of crashing.
  if (Platform.OS === 'web') {
    auth = getAuth(firebaseApp);
  } else {
    try {
      auth = initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) });
    } catch {
      auth = getAuth(firebaseApp);
    }
  }

  db = getFirestore(firebaseApp);
}

export { firebaseApp, auth, db };

// Firestore-dependent hooks only ever run inside the authenticated stack,
// which is unreachable unless Firebase is configured — so this should never
// actually throw, but keeps the null-checked `db` export honest for callers
// outside that guarantee.
export function requireDb(): Firestore {
  if (!db) throw new Error('Firebase is not configured — see .env.example');
  return db;
}
