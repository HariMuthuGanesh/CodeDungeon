<div align="center">

# 🏰 Code Dungeon

### *Escape Through Logic*

A story-driven, gamified programming competition platform where teams battle through dungeon chambers by solving C++ challenges.

![Tech Stack](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

</div>

---

## 🎯 What is Code Dungeon?

Code Dungeon transforms a traditional coding contest into an adventure. Teams are locked inside an ancient dungeon and must solve programming challenges to unlock each chamber and escape — competing for time and points on a live leaderboard.

---

## 🗂️ Project Structure

```
CodeDungeon/
├── frontend/          # React + Vite client
│   ├── src/
│   │   ├── components/
│   │   └── App.jsx
│   └── package.json
├── backend/           # Node.js + Express + Socket.IO server
│   ├── server.js
│   └── package.json
└── README.md
```

---

## ⚙️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React, Vite, Monaco Editor          |
| Backend    | Node.js, Express, Socket.IO         |
| Database   | Supabase (PostgreSQL + Realtime)    |
| Compiler   | g++ (C++ only)                      |
| Deployment | Render (backend) / Vercel (frontend)|

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A Supabase project

### 1. Clone the repo

```bash
git clone https://github.com/HariMuthuGanesh/CodeDungeon.git
cd CodeDungeon
```

### 2. Configure environment variables

**Backend** — create `backend/.env`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=5000
MOCK_TEAM_PASSWORD=your_team_password
```

**Frontend** — create `frontend/.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

### 3. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 4. Run locally

```bash
# Terminal 1 — Backend
cd backend && node server.js

# Terminal 2 — Frontend
cd frontend && npm run dev
```

---

## 🏛️ Database Schema

| Table         | Purpose                                     |
|---------------|---------------------------------------------|
| `teams`       | Registered competition teams                |
| `rooms`       | Dungeon chambers with problem statements    |
| `submissions` | All code submissions with status & timing   |

> Leaderboard is a derived **view** — not a stored table — ensuring always-live rankings.

---

## 🗺️ Dungeon Map

```
Entrance → Room 1 → Room 2 → Room 3 → Room 4 → Boss Chamber → 🏆 Treasure Room
           Easy      Easy     Medium   Medium       Hard
           20 pts    20 pts   40 pts   40 pts      100 pts
```

Each room is **fully open** from the start, allowing teams to tackle challenges in any order.

---

## ✅ Verification Modes

| Mode              | Description                                      |
|-------------------|--------------------------------------------------|
| **Auto Judge**    | Compile → run hidden tests → accept/reject       |
| **File Upload**   | Organiser reviews uploaded `.cpp` file           |
| **Manual**        | Participant demos solution to judge directly     |

---

## 🛡️ Security

- All secrets are stored in `.env` files — **never committed to git** (see `.env.example`).
- **DDoS Protection**: Custom proxy-safe rate limiting is enabled via `express-rate-limit`, ensuring brute-force protection without locking out shared NATs (e.g., college networks).
- **HTTP Headers**: Enforced securely using Helmet.
- Backend uses `service_role` key (server-side only)
- Frontend uses `anon` key (safe for browser)
- Row Level Security (RLS) enabled on all Supabase tables

---

## 📄 License

MIT © [Hari Muthu Ganesh](https://github.com/HariMuthuGanesh)
