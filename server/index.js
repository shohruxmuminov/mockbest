const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./db');

// Initialize Express App
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Connect API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Serve static React app in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Socket.io for Real-time warnings & Fullscreen monitoring
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('register_admin', () => {
    socket.join('admin_room');
    console.log('Admin joined room');
  });

  socket.on('register_candidate', (candidateCode) => {
    socket.join(`candidate_${candidateCode}`);
    console.log(`Candidate ${candidateCode} joined room`);
  });

  socket.on('fullscreen_exit', (data) => {
    // data: { candidateName, candidateCode, currentSection }
    console.log('Fullscreen exit detected:', data);
    io.to('admin_room').emit('alert_fullscreen_exit', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('send_warning', (data) => {
    // data: { candidateCode, candidateName }
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
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

// Initialize Database
initDb().then(() => {
  console.log('Database initialized successfully.');
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
