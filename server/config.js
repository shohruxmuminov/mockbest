import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Auth
  jwtSecret:
    process.env.JWT_SECRET ||
    'ielts-dev-secret-change-me-in-production-0xDEADBEEF',
  // The only Google account allowed to access the Admin Panel.
  adminEmail: (process.env.ADMIN_EMAIL || 'shohruxmuminov201@gmail.com')
    .trim()
    .toLowerCase(),
  // Google OAuth client id used to verify Google Sign-In ID tokens (admin).
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  // Optional fallback password login for the admin when Google OAuth is not
  // configured in the deployment environment. Leave empty to disable.
  adminPassword: process.env.ADMIN_PASSWORD || '',

  // Storage
  dataDir: process.env.DATA_DIR || path.join(ROOT, 'data'),
  uploadDir: process.env.UPLOAD_DIR || path.join(ROOT, 'server', 'uploads'),

  // Paths
  root: ROOT,
  clientDist: path.join(ROOT, 'client', 'dist'),

  // Limits
  maxUploadBytes: parseInt(process.env.MAX_UPLOAD_BYTES || '209715200', 10), // 200 MB

  // Test timing (seconds) — answer sheets get 5 minutes each.
  answerSheetSeconds: parseInt(process.env.ANSWER_SHEET_SECONDS || '300', 10),
};

export default config;
