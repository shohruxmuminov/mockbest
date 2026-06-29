import { Server } from 'socket.io';
import db from './db.js';
import { verifyToken } from './auth.js';

// candidateId -> { fullName, code, section, since } of currently connected candidates.
const presence = new Map();

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const decoded = verifyToken(token);
    if (!decoded) return next(new Error('Unauthorized'));
    socket.user = decoded;
    next();
  });

  io.on('connection', (socket) => {
    const { user } = socket;

    if (user.role === 'admin') {
      socket.join('admins');
      // Send current presence snapshot to the newly connected admin.
      socket.emit('monitor:presence', Array.from(presence.entries()).map(([id, v]) => ({ candidateId: id, ...v })));

      socket.on('admin:warning', ({ candidateId }) => {
        const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(Number(candidateId));
        if (!c) return;
        db.prepare(
          'INSERT INTO monitoring_events (candidate_id, type, detail) VALUES (?, ?, ?)'
        ).run(c.id, 'warning', 'Admin sent full-screen warning');
        io.to(`candidate:${c.id}`).emit('candidate:warning', { fullName: c.full_name });
      });

      socket.on('admin:ban', ({ candidateId }) => {
        const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(Number(candidateId));
        if (!c) return;
        db.prepare('UPDATE candidates SET banned = 1 WHERE id = ?').run(c.id);
        db.prepare(
          'INSERT INTO monitoring_events (candidate_id, type, detail) VALUES (?, ?, ?)'
        ).run(c.id, 'ban', 'Admin banned candidate during exam');
        io.to(`candidate:${c.id}`).emit('candidate:banned');
        presence.delete(c.id);
        io.to('admins').emit('monitor:left', { candidateId: c.id });
      });
    }

    if (user.role === 'candidate') {
      const c = db.prepare('SELECT * FROM candidates WHERE id = ?').get(user.id);
      if (!c) {
        socket.disconnect(true);
        return;
      }
      socket.join(`candidate:${c.id}`);

      const enter = (section) => {
        presence.set(c.id, {
          fullName: c.full_name,
          code: c.code,
          section: section || 'idle',
          since: new Date().toISOString(),
        });
        io.to('admins').emit('monitor:join', {
          candidateId: c.id,
          fullName: c.full_name,
          code: c.code,
          section: section || 'idle',
          since: presence.get(c.id).since,
        });
      };
      enter('idle');

      // Candidate started / moved to a section.
      socket.on('candidate:section', ({ section }) => {
        const cur = presence.get(c.id);
        if (cur) {
          cur.section = section;
          io.to('admins').emit('monitor:update', { candidateId: c.id, section });
        }
      });

      // Candidate left full screen during the exam — alert admins instantly.
      socket.on('monitor:fullscreen-exit', ({ section }) => {
        const ts = new Date().toISOString();
        db.prepare(
          'INSERT INTO monitoring_events (candidate_id, type, section, detail) VALUES (?, ?, ?, ?)'
        ).run(c.id, 'fullscreen_exit', section || null, 'Candidate exited full screen');
        io.to('admins').emit('monitor:alert', {
          candidateId: c.id,
          fullName: c.full_name,
          code: c.code,
          section: section || 'unknown',
          timestamp: ts,
        });
      });

      socket.on('disconnect', () => {
        presence.delete(c.id);
        io.to('admins').emit('monitor:left', { candidateId: c.id });
      });
    }
  });

  return io;
}
