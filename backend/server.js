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
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*' },
});

// Share io instance with controllers
setIO(io);

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
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
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Code Dungeon backend running on port ${PORT}`);
});
