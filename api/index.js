// Vercel Serverless Function entry. All /api/* requests are routed here by
// vercel.json and handled by the shared Express app.
import { createApp } from '../server/app.js';
import { initDb } from '../server/db.js';

try {
  // Initialize DB on cold start in Vercel
  await initDb();
} catch (e) {
  console.warn('DB Init Error on cold start:', e.message);
}

const app = createApp();

export default app;
