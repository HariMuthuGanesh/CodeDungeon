const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/CodeDungeon/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. Insert new Room 5 (Section 2, Question 2)
  const room5 = {
    title: 'The Alchemist\'s Loop',
    topic: 'Code Tracing & Logic',
    difficulty: 'hard',
    points: 40,
    section: 2,
    type: 'pattern_manual',
    problem_statement: `Analyze the following ancient scroll (C++ code) and predict its exact output.

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    int x = 2;
    for (int i = 0; i < 3; i++) {
        x = x * 2 + 1;
    }
    cout << x;
    return 0;
}
\`\`\`

Input your predicted output pattern exactly as it would appear on the console.`,
    expected_pattern: '23'
  };

  // 3. Insert new Room 6 (Section 2, Question 3)
  const room6 = {
    title: 'The Golden Ratio',
    topic: 'Code Tracing & Logic',
    difficulty: 'hard',
    points: 40,
    section: 2,
    type: 'pattern_manual',
    problem_statement: `Analyze the following ancient scroll (C++ code) and predict its exact output.

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    int a = 0, b = 1;
    for (int i = 0; i < 4; i++) {
        cout << a << " ";
        int temp = a + b;
        a = b;
        b = temp;
    }
    return 0;
}
\`\`\`

Input your predicted output pattern exactly as it would appear on the console.`,
    expected_pattern: '0 1 1 2 '
  };

  async function run() {
    const { error: err1 } = await supabase
      .from('rooms')
      .update(room5)
      .eq('room_order', 5);

    const { error: err2 } = await supabase
      .from('rooms')
      .update(room6)
      .eq('room_order', 6);

    if (err1 || err2) {
      console.error("Error updating rooms:", err1 || err2);
    } else {
      console.log("Successfully updated Rooms 5 and 6!");
    }
  }
  
  run();
