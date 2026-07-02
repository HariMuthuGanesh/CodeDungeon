require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// ─── Config ───────────────────────────────────────────────────────────────────
const { setIO } = require('./config/socket');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const roomsRoutes       = require('./routes/rooms');
const submissionsRoutes = require('./routes/submissions');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes       = require('./routes/admin');

// ─── Middleware ────────────────────────────────────────────────────────────────
const errorHandler = require('./middleware/errorHandler');

// ─── Socket Events ────────────────────────────────────────────────────────────
const { registerSocketEvents } = require('./socket/events');

// ─── App Setup ────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const CORS_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// Allow any localhost port in dev (handles Vite auto-incrementing ports)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || origin.startsWith('http://localhost') || CORS_ORIGIN === '*' || origin === CORS_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

const io = new Server(server, {
  cors: { origin: (origin, cb) => cb(null, true), credentials: true },
});

// Share io instance with controllers
setIO(io);

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Code Dungeon Backend API is up and running! 🚀');
});

app.get('/api/health', (req, res) =>
  res.json({ success: true, status: 'Code Dungeon backend is running.' })
);

app.use('/api/auth',        authRoutes);
app.use('/api/rooms',       roomsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin',       adminRoutes);

// 404 handler
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` })
);

// Global error handler (must be last)
app.use(errorHandler);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
registerSocketEvents(io);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Code Dungeon backend running on port ${PORT}`);
});
