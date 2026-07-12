import http from 'http';
import { Server } from 'socket.io';
import config from './config.js';
import { initDb as initPostgres } from './db.js';
import { initDb as initFirestore } from './firestore-db.js';
import { createApp } from './app.js';

// Create the Express app (used by both local and Vercel)
const app = createApp();

// Initialize database on cold start (non-blocking so the export isn't delayed)
if (config.useFirestore) {
  initFirestore()
    .then(() => console.log('✓ Firestore initialized successfully'))
    .catch((e) => console.warn('⚠ Firestore init warning:', e.message));
} else if (config.databaseUrl) {
  initPostgres()
    .then(() => console.log('✓ Database initialized successfully'))
    .catch((e) => console.warn('⚠ DB init warning:', e.message));
}

// ---------- Local development: full HTTP server + Socket.io ----------
if (!process.env.VERCEL) {
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('register_admin', () => {
      socket.join('admin_room');
      console.log('Admin registered');
    });

    socket.on('register_candidate', (candidateCode) => {
      socket.join(`candidate_${candidateCode}`);
      console.log(`Candidate ${candidateCode} registered`);
    });

    socket.on('fullscreen_exit', (data) => {
      console.log('Fullscreen exit detected:', data);
      io.to('admin_room').emit('alert_fullscreen_exit', {
        ...data,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('send_warning', (data) => {
      console.log(`Sending warning to ${data.candidateCode}`);
      io.to(`candidate_${data.candidateCode}`).emit('receive_warning', {
        message: `Dear ${data.candidateName},\n\nLeaving Full Screen during the examination is strictly prohibited.\n\nPlease continue your examination in Full Screen mode.`,
      });
    });

    socket.on('ban_candidate', (data) => {
      console.log(`Banning candidate ${data.candidateCode}`);
      io.to(`candidate_${data.candidateCode}`).emit('receive_ban');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(config.port, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║  Mock Test Server                                  ║
╠═══════════════════════════════════════════════════╣
║  Port: ${config.port}                                  ║
║  Environment: ${config.nodeEnv.toUpperCase()}                    ║
║  Database: ${config.useFirestore ? 'Firestore' : config.databaseUrl ? 'Supabase PostgreSQL' : 'Not configured'}    ║
╚═══════════════════════════════════════════════════╝
    `);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// ---------- Vercel Serverless: export the Express app ----------
export default app;
