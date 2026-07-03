const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const rooms = [
  {
    room_order: 1,
    title: 'The Sum Scroll',
    topic: 'Basic Loops',
    difficulty: 'easy',
    points: 20,
    problem_statement: `Arrange the following code to print the sum of numbers from 1 to N.
Input: 5
Output: 15`,
    section: 1,
    type: 'rearrangement',
    correct_order: ['#include <iostream>', 'using namespace std;', 'int main() {', 'int n;', 'cin >> n;', 'int sum = 0;', 'for(int i = 1; i <= n; i++)', '    sum += i;', 'cout << sum;', 'return 0;', '}'],
    shuffled_order: ['int main() {', 'int sum = 0;', 'cout << sum;', 'cin >> n;', 'return 0;', '}', 'for(int i = 1; i <= n; i++)', '    sum += i;', '#include <iostream>', 'using namespace std;', 'int n;']
  },
  {
    room_order: 2,
    title: 'The Prime Oracle',
    topic: 'Logic',
    difficulty: 'medium',
    points: 30,
    problem_statement: `Arrange the code to determine whether a number is Prime.
Input: 13
Output: Prime`,
    section: 1,
    type: 'rearrangement',
    correct_order: ['#include<iostream>', 'using namespace std;', 'int main(){', 'int n;', 'cin>>n;', 'bool prime = true;', 'if(n<2)', 'prime=false;', 'for(int i=2;i*i<=n;i++){', 'if(n%i==0)', 'prime=false;', '}', 'if(prime)', 'cout<<"Prime";', 'else', 'cout<<"Not Prime";', 'return 0;', '}'],
    shuffled_order: ['bool prime = true;', 'int main(){', 'for(int i=2;i*i<=n;i++){', '#include<iostream>', 'using namespace std;', 'if(n<2)', 'prime=false;', 'if(n%i==0)', 'prime=false;', 'int n;', 'cin>>n;', 'if(prime)', 'cout<<"Prime";', 'else', 'cout<<"Not Prime";', 'return 0;', '}', '}']
  },
  {
    room_order: 3,
    title: 'The Array Spinner',
    topic: 'Arrays',
    difficulty: 'hard',
    points: 40,
    problem_statement: `Arrange the program to rotate an array to the right by one position.
Input: 5
1 2 3 4 5
Output: 5 1 2 3 4`,
    section: 1,
    type: 'rearrangement',
    correct_order: ['#include<iostream>', 'using namespace std;', 'int main(){', 'int a[100],n;', 'cin>>n;', 'for(int i=0;i<n;i++)', 'cin>>a[i];', 'int temp=a[n-1];', 'for(int i=n-1;i>0;i--)', 'a[i]=a[i-1];', 'a[0]=temp;', 'for(int i=0;i<n;i++)', 'cout<<a[i]<<" ";', 'return 0;', '}'],
    shuffled_order: ['int temp=a[n-1];', 'for(int i=n-1;i>0;i--)', 'a[i]=a[i-1];', '#include<iostream>', 'using namespace std;', 'for(int i=0;i<n;i++)', 'cout<<a[i]<<" ";', 'int main(){', 'cin>>n;', 'a[0]=temp;', 'int a[100],n;', 'for(int i=0;i<n;i++)', 'cin>>a[i];', 'return 0;', '}']
  },
  {
    room_order: 4,
    title: 'The Pointer Trap',
    topic: 'Pointers',
    difficulty: 'medium',
    points: 40,
    problem_statement: `Predict the exact output pattern of the following code.

\`\`\`cpp
#include <iostream>
using namespace std;
int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int *p = arr;
    *(p++) += 5;
    *++p += 10;
    cout << arr[0] << " " << arr[1] << " " << arr[2];
    return 0;
}
\`\`\`

Input your predicted output exactly as it appears.`,
    section: 2,
    type: 'pattern_manual',
    expected_pattern: '15 20 40'
  },
  {
    room_order: 5,
    title: 'The Recursive Binary',
    topic: 'Recursion',
    difficulty: 'medium',
    points: 40,
    problem_statement: `Predict the exact output pattern of the following code.

\`\`\`cpp
#include <iostream>
using namespace std;
void mystery(int n) {
    if(n <= 0) return;
    mystery(n / 2);
    cout << n % 2;
}
int main() {
    mystery(25);
    return 0;
}
\`\`\`

Input your predicted output exactly as it appears.`,
    section: 2,
    type: 'pattern_manual',
    expected_pattern: '11001'
  },
  {
    room_order: 6,
    title: 'The String Illusion',
    topic: 'String Manipulation',
    difficulty: 'hard',
    points: 50,
    problem_statement: `Predict the exact output pattern of the following code.

\`\`\`cpp
#include <iostream>
using namespace std;
int main() {
    char str[] = "Dungeon";
    for(int i = 0; str[i] != '\\0'; i++) {
        if(i % 2 == 0) str[i] = str[i] + 1;
        else str[i] = str[i] - 1;
    }
    cout << str;
    return 0;
}
\`\`\`

Input your predicted output exactly as it appears.`,
    section: 2,
    type: 'pattern_manual',
    expected_pattern: 'Etoffno'
  },
  {
    room_order: 7,
    title: 'The Cipher Gate',
    topic: 'Strings & Parsing',
    difficulty: 'hard',
    points: 80,
    problem_statement: `A dungeon gate opens only if a given string is a palindrome after removing all spaces and converting every character to lowercase.

**Print**
\`OPEN\` or \`LOCKED\`

**Input**
A single line string. (1 <= Length <= 100000)

**Example**
Input: \`Never Odd Or Even\`
Output: \`OPEN\``,
    section: 3,
    type: 'coding_auto'
  },
  {
    room_order: 8,
    title: 'Dungeon Energy Network',
    topic: 'Dynamic Programming',
    difficulty: 'boss',
    points: 120,
    problem_statement: `The dungeon consists of N rooms, each containing an energy crystal.
The strength of each crystal is given as an array.
Your task is to determine the maximum sum of any contiguous sequence of rooms.

**Input**
First line: \`N\` (1 <= N <= 100000)
Second line: N space-separated integers.

**Output**
Maximum contiguous energy sum.

**Example**
Input:
\`8\`
\`-2 -3 4 -1 -2 1 5 -3\`
Output: \`7\``,
    section: 3,
    type: 'coding_auto'
  }
];

async function run() {
  console.log('🔄 Deleting existing submissions and rooms...');
  const { error: subErr } = await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (subErr) console.error("Error deleting submissions:", subErr);
  
  const { error: roomErr } = await supabase.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (roomErr) console.error("Error deleting rooms:", roomErr);

  console.log('🔄 Inserting new Round 3 rooms...');
  for (const room of rooms) {
    const { data, error } = await supabase.from('rooms').insert(room);
    if (error) {
      console.error(`Failed to insert Room ${room.room_order}:`, error);
    } else {
      console.log(`Inserted Room ${room.room_order}`);
    }
  }
  
  console.log('✅ Seeding complete!');
  
  console.log('\n⚡ IMPORTANT SQL COMMAND ⚡');
  console.log('Run the following command in the Supabase SQL Editor to update the leaderboard scoring:');
  console.log(`
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  t.id AS team_id,
  t.team_name,
  COUNT(s.id)                AS rooms_cleared,
  COALESCE(SUM(r.points), 0) AS total_points,
  -- Calculate time elapsed from team creation to their final cleared room (in seconds)
  EXTRACT(EPOCH FROM (MAX(s.submitted_at) - t.created_at)) AS total_time_seconds,
  MAX(s.submitted_at)        AS last_submission_at
FROM teams t
LEFT JOIN submissions s ON s.team_id = t.id AND s.status = 'accepted'
LEFT JOIN rooms r ON r.id = s.room_id
GROUP BY t.id, t.team_name, t.created_at
ORDER BY total_points DESC, total_time_seconds ASC NULLS LAST;
  `);
}

run();
