require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
// Note: This client will throw an error if URL/Key are empty placeholders, 
// so we'll wrap it in a try-catch for local development without DB if needed.
let supabase;
try {
    if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL_HERE' && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn('Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
    }
} catch (e) {
    console.error('Failed to initialize Supabase client:', e);
}

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Code Dungeon Backend is running!' });
});

// Mock login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { teamName, password } = req.body;
    
    // TODO: Replace with real Supabase Auth lookup in production
    const mockPassword = process.env.MOCK_TEAM_PASSWORD;
    if (teamName && mockPassword && password === mockPassword) {
        return res.json({ success: true, teamId: 'mock-team-123', teamName });
    }
    
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
