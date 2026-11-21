import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Public Firebase Web Configuration for CivicResolve.
 * No analytics or measurementId per project specifications.
 */
export const firebaseConfig = {
  apiKey: "AIzaSyDnMl-ZF8WhL7EnUf4eBNfDENVn5SjUJHg",
  authDomain: "civicresolve-250c0.firebaseapp.com",
  projectId: "civicresolve-250c0",
  storageBucket: "civicresolve-250c0.firebasestorage.app",
  messagingSenderId: "812607217279",
  appId: "1:812607217279:web:13e81c66a8f9dc7d9d694a",
};

/**
 * Returns or initializes the client-side Firebase app instance.
 */
export const clientApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/**
 * Client-side Firebase Auth instance.
 */
export const clientAuth: Auth = getAuth(clientApp);
