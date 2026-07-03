const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/CodeDungeon/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const codeBlocks = [
    "#include <iostream>",
    "using namespace std;",
    "int main() {",
    "    int n = 5;",
    "    for (int i = 0; i < n; i++) {",
    "        cout << i << endl;",
    "    }",
    "    return 0;",
    "}"
  ];

  const shuffledBlocks = [
    "    for (int i = 0; i < n; i++) {",
    "        cout << i << endl;",
    "using namespace std;",
    "#include <iostream>",
    "    return 0;",
    "    int n = 5;",
    "}",
    "    }",
    "int main() {"
  ];

  const { data, error } = await supabase
    .from('rooms')
    .update({
      type: 'rearrangement',
      topic: 'Loops and Structure',
      title: 'Forest of Arrays (Rearranged)',
      problem_statement: 'The ancient array spell has been scattered. Reassemble the code to print numbers from 0 to 4 in order.',
      correct_order: codeBlocks,
      shuffled_order: shuffledBlocks,
      expected_pattern: null
    })
    .eq('room_order', 3)
    .select();

  if (error) console.error("Error:", error);
  else console.log("Success:", data);
}

run();
