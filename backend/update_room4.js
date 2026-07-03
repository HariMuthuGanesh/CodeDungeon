const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/CodeDungeon/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const problemStatement = `Analyze the following ancient scroll (C++ code) and predict its exact output.

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    int magic = 1;
    for (int i = 1; i <= 4; i++) {
        magic *= i;
        cout << magic << " ";
    }
    return 0;
}
\`\`\`

Input your predicted output pattern exactly as it would appear on the console.`;

  const { data, error } = await supabase
    .from('rooms')
    .update({
      topic: 'Code Tracing & Logic',
      problem_statement: problemStatement,
    })
    .eq('room_order', 4)
    .select();

  if (error) console.error("Error:", error);
  else console.log("Success:", data);
}

run();
