import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAkygp5YgWKn-1c_7PnEAGm4xzpET19HMw",
    authDomain: "lithub-79aa9.firebaseapp.com",
    projectId: "lithub-79aa9",
    storageBucket: "lithub-79aa9.firebasestorage.app",
    messagingSenderId: "572558552840",
    appId: "1:572558552840:web:262d1f45ff912cdb3886bd"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);