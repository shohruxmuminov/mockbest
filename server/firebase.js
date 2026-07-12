import admin from 'firebase-admin';
import { getFirestore as getFirestoreAdmin } from 'firebase-admin/firestore';
import { getAuth as getAuthAdmin } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
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

  // If a service account file path is provided, load it
  if (firebaseServiceAccountPath) {
    const serviceAccount = JSON.parse(readFileSync(firebaseServiceAccountPath, 'utf8'));
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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
  return getFirestoreAdmin(app);
}

/**
 * Get the Firebase Auth instance.
 */
export function getAuth() {
  const app = getFirebaseApp();
  return getAuthAdmin(app);
}

export default {
  getFirebaseApp,
  getFirestore,
  getAuth,
};