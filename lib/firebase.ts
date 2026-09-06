import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const auth: Auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

const db: Firestore = getFirestore(app);

export { app, auth, db };
