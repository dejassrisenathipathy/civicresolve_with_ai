import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

/**
 * Initializes and retrieves the singleton Firebase Admin App instance.
 * Uses environment variables with cert(), converting literal \n in private key to real newlines.
 *
 * @returns {App} The singleton Firebase Admin App.
 */
function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Graceful fallback for build step and test runners when env vars are not set
  return initializeApp({
    projectId: projectId || 'civicresolve-250c0',
  });
}

const adminApp: App = getAdminApp();

/**
 * Cloud Firestore server-side instance.
 */
export const adminDb: Firestore = getFirestore(adminApp);

/**
 * Firebase Auth server-side instance.
 */
export const adminAuth: Auth = getAuth(adminApp);
