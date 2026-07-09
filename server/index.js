import http from 'http';
import { Server } from 'socket.io';
import config from './config.js';
import { initDb } from './db.js';
import { createApp } from './app.js';

async function start() {
  try {
    // Initialize database
    console.log('Initializing database...');
    await initDb();
    console.log('✓ Database initialized successfully');

    // Create Express app
    const app = createApp();
    const server = http.createServer(app);

    // Initialize Socket.io for real-time communications
    const io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Socket.io event handlers
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
          timestamp: new Date().toISOString()
        });
      });

      socket.on('send_warning', (data) => {
        console.log(`Sending warning to ${data.candidateCode}`);
        io.to(`candidate_${data.candidateCode}`).emit('receive_warning', {
          message: `Dear ${data.candidateName},\n\nLeaving Full Screen during the examination is strictly prohibited.\n\nPlease continue your examination in Full Screen mode.`
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

    // Start server
    if (!process.env.VERCEL) {
      server.listen(config.port, () => {
        console.log(`
╔═══════════════════════════════════════════════════╗
║  Mock Test Server                                  ║
╠═══════════════════════════════════════════════════╣
║  Port: ${config.port}                                  ║
║  Environment: ${config.nodeEnv.toUpperCase()}                    ║
║  Database: PostgreSQL                              ║
╚═══════════════════════════════════════════════════╝
        `);
      });
    }

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    // Export for serverless environments
    export default server;

  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
