import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env.local (development) or .env (production)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '.env.local') });
}
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const ROOT = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',

  // Supabase JS client (optional – for Storage, Auth, Realtime)
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',

  // Admin Configuration
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@example.com')
    .trim()
    .toLowerCase(),
  adminPassword: (process.env.ADMIN_PASSWORD || '').trim(),
  // Simple admin access code (default 2010).
  adminCode: (process.env.ADMIN_CODE || '2010').toString().trim(),

  // Firebase / Firestore Configuration
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',

  // Use Firestore instead of PostgreSQL (set to 'true' to enable)
  useFirestore: process.env.USE_FIRESTORE === 'true',

  // Max upload size (default 200 MB; note Vercel caps request body at ~4.5 MB).
  maxUploadBytes: parseInt(process.env.MAX_UPLOAD_BYTES || '209715200', 10),

  // Paths
  root: ROOT,
  clientDist: path.join(ROOT, 'dist'),

  // Answer sheets get 5 minutes each.
  answerSheetSeconds: parseInt(process.env.ANSWER_SHEET_SECONDS || '300', 10),
};

export default config;