/**
 * Supabase SQL Migration Runner for Round 2 via PG Driver
 * Connects directly to Postgres database and executes queries.
 * Run: node migrate_round2.js
 */

require('dotenv').config();
const { Client } = require('pg');

const config = {
  host: 'db.nmuqgeqssaoovuidpbxn.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'sb_secret_SDQ08ObP0pilFN1UoU4WNA_1PM1ps53',
  ssl: {
    rejectUnauthorized: false
  }
};

const SQL = `
-- 1. Alter tables to add new columns
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS section INT NOT NULL DEFAULT 1;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS type TEXT NOT NULL CHECK (type IN ('rearrangement', 'coding_auto', 'pattern_manual', 'coding_manual')) DEFAULT 'coding_manual';
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS correct_order JSONB;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS shuffled_order JSONB;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS expected_pattern TEXT;

ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_order JSONB;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS review_duration INT;

-- 2. Clear existing submissions and rooms to reset the game configuration
TRUNCATE TABLE submissions CASCADE;
TRUNCATE TABLE rooms CASCADE;

-- 3. Seed new Round 2 challenges
INSERT INTO rooms (room_order, title, topic, difficulty, points, problem_statement, section, type, correct_order, shuffled_order, expected_pattern) VALUES
  (1, 'The Shuffled Sigil', 'Basic Loops', 'easy', 20, 
   'Rearrange the lines of code to print numbers from 1 to N.\\nInput: A single integer N.\\nOutput: Numbers 1 to N each on a new line.', 
   1, 'rearrangement', 
   '["#include <iostream>", "using namespace std;", "int main() {", "    int n;", "    cin >> n;", "    for (int i = 1; i <= n; i++) {", "        cout << i << endl;", "    }", "    return 0;", "}"]'::jsonb, 
   '["    cin >> n;", "using namespace std;", "#include <iostream>", "    for (int i = 1; i <= n; i++) {", "    return 0;", "int main() {", "        cout << i << endl;", "    }", "    int n;", "}"]'::jsonb, 
   NULL),
  (2, 'The Reversed Scroll', 'Strings', 'easy', 20, 
   'Rearrange the lines of code to reverse a given string.\\nInput: A single string S.\\nOutput: The reversed string S.', 
   1, 'rearrangement', 
   '["#include <iostream>", "#include <string>", "#include <algorithm>", "using namespace std;", "int main() {", "    string s;", "    cin >> s;", "    reverse(s.begin(), s.end());", "    cout << s << endl;", "    return 0;", "}"]'::jsonb, 
   '["    cin >> s;", "using namespace std;", "#include <string>", "#include <algorithm>", "#include <iostream>", "    reverse(s.begin(), s.end());", "int main() {", "    return 0;", "    string s;", "    cout << s << endl;", "}"]'::jsonb, 
   NULL),
  (3, 'Forest of Arrays', 'Arrays', 'medium', 40, 
   'Write a C++ program that finds the maximum and minimum element in an array.\\nInput: First line is N, second line contains N integers.\\nOutput: Max and Min separated by a space.', 
   1, 'coding_auto', 
   NULL, 
   NULL, 
   NULL),
  (4, 'The Ancient Library', 'Pattern Prediction', 'medium', 40, 
   'Predict the output pattern of the following sequence for input N = 6.\\nSequence rule: A(n) = A(n-1) * 2 - 1, starting with A(1) = 2.\\nOutput the value of A(6).\\nInput your derived integer value.', 
   2, 'pattern_manual', 
   NULL, 
   NULL, 
   '33'),
  (5, 'Boss Chamber', 'Comprehensive', 'boss', 100, 
   'Implement a student record system. Read N student records (name and marks), then output them sorted by marks in descending order.\\nInput: First line N, then N lines of "name marks".\\nOutput: Sorted records one per line.', 
   3, 'coding_manual', 
   NULL, 
   NULL, 
   NULL);
`;

const client = new Client(config);

(async () => {
  console.log('🔄 Running Round 2 migrations directly via pg client...');
  try {
    await client.connect();
    console.log('🔌 Connected to database!');
    
    await client.query(SQL);
    console.log('✅ Round 2 migrations completed successfully!');
  } catch (err) {
    console.error('❌ Error during migrations:', err);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
})();
