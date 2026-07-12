import admin from 'firebase-admin';
import { config } from './config.js';

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK.
 * Uses a service account JSON path or GOOGLE_APPLICATION_CREDENTIALS env var.
 * Returns the Firebase Admin app instance.
 */
export function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const { firebaseServiceAccountPath, firebaseProjectId, firebaseClientEmail, firebasePrivateKey } = config;

  // If a service account file path is provided, use it
  if (firebaseServiceAccountPath) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseProjectId,
    });
  } else if (firebaseClientEmail && firebasePrivateKey) {
    // Use explicit service account credentials from env vars
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // Fallback to application default credentials
    firebaseApp = admin.initializeApp({
      projectId: firebaseProjectId,
    });
  }

  console.log('✓ Firebase Admin SDK initialized successfully');
  return firebaseApp;
}

/**
 * Get the Firestore database instance.
 */
export function getFirestore() {
  const app = getFirebaseApp();
  return admin.firestore(app);
}

/**
 * Get the Firebase Auth instance.
 */
export function getAuth() {
  const app = getFirebaseApp();
  return admin.auth(app);
}

export default {
  getFirebaseApp,
  getFirestore,
  getAuth,
};