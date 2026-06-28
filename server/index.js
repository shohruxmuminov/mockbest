import http from 'http';
import fs from 'fs';
import path from 'path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import config from './config.js';
import './db.js'; // initialize database & directories

import authRoutes from './routes/auth.js';
import adminCandidates from './routes/adminCandidates.js';
import adminMockTests from './routes/adminMockTests.js';
import adminReview from './routes/adminReview.js';
import mockTests from './routes/mockTests.js';
import submissions from './routes/submissions.js';
import files from './routes/files.js';
import { initSocket } from './socket.js';

const app = express();
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

// Health check for deployment platforms.
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/candidates', adminCandidates);
app.use('/api/admin/mock-tests', adminMockTests);
app.use('/api/admin/review', adminReview);
app.use('/api/mock-tests', mockTests);
app.use('/api/submissions', submissions);
app.use('/api/files', files);

// Multer / payload error handler.
app.use((err, req, res, next) => {
  if (err) {
    const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
    return res.status(status).json({ error: err.message || 'Request failed.' });
  }
  next();
});

// Serve the built client in production.
if (fs.existsSync(config.clientDist)) {
  app.use(express.static(config.clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(config.clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) =>
    res.send(
      '<h1>IELTS Mock Test Platform API</h1><p>Client build not found. Run <code>npm run build</code>.</p>'
    )
  );
}

const server = http.createServer(app);
initSocket(server);

server.listen(config.port, () => {
  console.log(`IELTS Mock Test Platform listening on http://localhost:${config.port}`);
  console.log(`  Admin email      : ${config.adminEmail}`);
  console.log(`  Google login     : ${config.googleClientId ? 'enabled' : 'disabled (set GOOGLE_CLIENT_ID)'}`);
  console.log(`  Password fallback: ${config.adminPassword ? 'enabled' : 'disabled'}`);
  console.log(`  Data dir         : ${config.dataDir}`);
});
