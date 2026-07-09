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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Postgres (Neon on Vercel, local Postgres in development).
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',

  // Admin Configuration
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@example.com')
    .trim()
    .toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  // Simple admin access code (default 2010).
  adminCode: (process.env.ADMIN_CODE || '2010').toString(),

  // Max upload size (default 200 MB; note Vercel caps request body at ~4.5 MB).
  maxUploadBytes: parseInt(process.env.MAX_UPLOAD_BYTES || '209715200', 10),

  // Paths
  root: ROOT,
  clientDist: path.join(ROOT, 'dist'),

  // Answer sheets get 5 minutes each.
  answerSheetSeconds: parseInt(process.env.ANSWER_SHEET_SECONDS || '300', 10),
};

export default config;
