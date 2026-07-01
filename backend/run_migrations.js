/**
 * Supabase SQL Migration Runner
 * Uses the Supabase Management API to create all Code Dungeon tables.
 * Run: node run_migrations.js
 */

require('dotenv').config();
const https = require('https');

const PROJECT_REF = 'nmuqgeqssaoovuidpbxn';

// The full SQL to execute
const SQL = `
-- 1. Teams table
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name   TEXT NOT NULL UNIQUE,
  members     TEXT[] NOT NULL DEFAULT '{}',
  password    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='teams' AND policyname='Service role full access on teams'
  ) THEN
    CREATE POLICY "Service role full access on teams"
      ON teams FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_order        INT NOT NULL UNIQUE,
  title             TEXT NOT NULL,
  topic             TEXT NOT NULL,
  difficulty        TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'boss')),
  points            INT NOT NULL DEFAULT 0,
  problem_statement TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='rooms' AND policyname='Authenticated users can read rooms'
  ) THEN
    CREATE POLICY "Authenticated users can read rooms"
      ON rooms FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='rooms' AND policyname='Service role full access on rooms'
  ) THEN
    CREATE POLICY "Service role full access on rooms"
      ON rooms FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id         UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  status          TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  notes           TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_submissions_team ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_room ON submissions(room_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_accepted ON submissions(team_id, room_id) WHERE status = 'accepted';
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='submissions' AND policyname='Service role full access on submissions'
  ) THEN
    CREATE POLICY "Service role full access on submissions"
      ON submissions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. Leaderboard view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  t.id AS team_id,
  t.team_name,
  COUNT(s.id)                AS rooms_cleared,
  COALESCE(SUM(r.points), 0) AS total_points,
  MAX(s.submitted_at)        AS last_submission_at
FROM teams t
LEFT JOIN submissions s ON s.team_id = t.id AND s.status = 'accepted'
LEFT JOIN rooms r ON r.id = s.room_id
GROUP BY t.id, t.team_name
ORDER BY total_points DESC, last_submission_at ASC NULLS LAST;

-- 5. Seed rooms
INSERT INTO rooms (room_order, title, topic, difficulty, points, problem_statement) VALUES
  (1, 'The Forgotten Gate',  'Basic Loops',   'easy',   20,
   'Write a C++ program that prints numbers from 1 to N on separate lines.\nInput: A single integer N (1 <= N <= 1000).\nOutput: Numbers 1 to N each on a new line.'),
  (2, 'Crystal Cavern',      'Strings',       'easy',   20,
   'Write a C++ program that reverses a given string.\nInput: A single string S (no spaces, length <= 100).\nOutput: The reversed string.'),
  (3, 'Forest of Arrays',    'Arrays',        'medium', 40,
   'Write a C++ program that finds the maximum and minimum element in an array.\nInput: First line is N, second line contains N integers.\nOutput: Max and Min separated by a space.'),
  (4, 'The Ancient Library', 'Functions',     'medium', 40,
   'Write a C++ program using a recursive function to compute the factorial of N.\nInput: A single integer N (0 <= N <= 12).\nOutput: The factorial of N.'),
  (5, 'Boss Chamber',        'Comprehensive', 'boss',   100,
   'Implement a simple student record system. Read N student records (name and marks), then output them sorted by marks in descending order.\nInput: First line N, then N lines of "name marks".\nOutput: Sorted records one per line.')
ON CONFLICT (room_order) DO NOTHING;
`;

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });

    const options = {
      hostname: `db.${PROJECT_REF}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Try Management API approach
async function runViaMgmtAPI(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('🔄 Running SQL migrations via Supabase Management API...');
  try {
    const result = await runViaMgmtAPI(SQL);
    console.log(`Status: ${result.status}`);
    console.log(`Response: ${result.body}`);

    if (result.status >= 200 && result.status < 300) {
      console.log('✅ Migrations completed successfully!');
    } else {
      console.log('⚠️  Unexpected response. Check output above.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
