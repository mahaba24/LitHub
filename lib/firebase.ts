import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
// firebase/auth's "types" export condition always resolves to the non-RN
// d.ts, even though Metro bundles the real React Native build that exports
// this function — the import is valid at runtime, tsc just can't see it.
// @ts-expect-error — getReactNativePersistence exists in the RN build's types, not the resolved d.ts
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAkygp5YgWKn-1c_7PnEAGm4xzpET19HMw",
  authDomain: "lithub-79aa9.firebaseapp.com",
  projectId: "lithub-79aa9",
  storageBucket: "lithub-79aa9.firebasestorage.app",
  messagingSenderId: "572558552840",
  appId: "1:572558552840:web:262d1f45ff912cdb3886bd"
};

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Already initialized (common during Fast Refresh) — just grab the existing instance
    auth = getAuth(app);
  }
}

const db: Firestore = getFirestore(app);

export { app, auth, db };

export function requireDb(): Firestore {
  if (!db) {
    throw new Error('Firestore has not been initialized yet.');
  }
  return db;
}

export function requireAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth has not been initialized yet.');
  }
  return auth;
}
