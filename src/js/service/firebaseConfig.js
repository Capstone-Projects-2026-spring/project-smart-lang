/**
 * firebaseConfig.js
 * Firebase configuration for Smart Lang AAC application.
 * Uses Firebase Authentication with Google OAuth provider.
 * Uses Firestore for caregiver-student cloud sync.
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for smartlangaac project
// Project ID: smartlangaac
// Project Number: 1079199938122
const firebaseConfig = {
  apiKey: "AIzaSyACbCrkfAUd40RJ5qTveqxGQyYtmCcF5Ck",
  authDomain: "smartlangaac.firebaseapp.com",
  projectId: "smartlangaac",
  storageBucket: "smartlangaac.firebasestorage.app",
  messagingSenderId: "1079199938122",
  appId: "1:1079199938122:web:3534605c9173c8608758b3",
  measurementId: "G-PY594ZTT7C",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore (used for caregiver↔student board sync)
const firestore = getFirestore(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Configure Google provider to always prompt for account selection
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app, auth, firestore, googleProvider };
