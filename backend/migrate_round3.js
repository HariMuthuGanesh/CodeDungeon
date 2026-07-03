const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const rooms = [
  // SECTION 1: REARRANGEMENT
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
    shuffled_order: ['#include <iostream>', 'int main() {', 'int n;', 'cin >> n;', 'int sum = 0;', 'for(int i = 1; i <= n; i++)', '    sum += i;', 'cout << sum;', 'return 0;', '}'] // simplified for brevity but matching actual frontend config
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
    shuffled_order: ['#include<iostream>', 'using namespace std;', 'int main(){', 'int n;', 'cin>>n;', 'bool prime = true;', 'if(n<2)', 'prime=false;', 'for(int i=2;i*i<=n;i++){', 'if(n%i==0)', 'prime=false;', '}', 'if(prime)', 'cout<<"Prime";', 'else', 'cout<<"Not Prime";', 'return 0;', '}']
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
    shuffled_order: ['#include<iostream>', 'using namespace std;', 'int main(){', 'int a[100],n;', 'cin>>n;', 'for(int i=0;i<n;i++)', 'cin>>a[i];', 'int temp=a[n-1];', 'for(int i=n-1;i>0;i--)', 'a[i]=a[i-1];', 'a[0]=temp;', 'for(int i=0;i<n;i++)', 'cout<<a[i]<<" ";', 'return 0;', '}']
  },
  
  // SECTION 2: PATTERN PREDICTION
  {
    room_order: 4,
    title: 'The Starry Loop',
    topic: 'Nested Loops',
    difficulty: 'medium',
    points: 30,
    problem_statement: `Predict the output
\`\`\`cpp
#include<iostream>
using namespace std;

int main()
{
    int n=5;

    for(int i=1;i<=n;i++)
    {
        for(int j=1;j<=i;j++)
            cout<<"*";

        cout<<endl;
    }
}
\`\`\``,
    section: 2,
    type: 'pattern_manual',
    expected_pattern: '*\n**\n***\n****\n*****'
  },
  {
    room_order: 5,
    title: 'The Number Loop',
    topic: 'Loops',
    difficulty: 'medium',
    points: 30,
    problem_statement: `Predict the output
\`\`\`cpp
#include<iostream>
using namespace std;

int main()
{
    int n=5;

    for(int i=n;i>=1;i--)
    {
        for(int j=1;j<=i;j++)
            cout<<j<<" ";

        cout<<endl;
    }
}
\`\`\``,
    section: 2,
    type: 'pattern_manual',
    expected_pattern: '1 2 3 4 5\n1 2 3 4\n1 2 3\n1 2\n1'
  },
  {
    room_order: 6,
    title: 'The Pyramid Scheme',
    topic: 'Nested Loops',
    difficulty: 'hard',
    points: 50,
    problem_statement: `Predict the output
\`\`\`cpp
#include<iostream>
using namespace std;

int main()
{
    int n=5;

    for(int i=1;i<=n;i++)
    {
        for(int j=1;j<=n-i;j++)
            cout<<" ";

        for(int k=1;k<=2*i-1;k++)
            cout<<"*";

        cout<<endl;
    }
}
\`\`\``,
    section: 2,
    type: 'pattern_manual',
    expected_pattern: '    *\n   ***\n  *****\n *******\n*********'
  },

  // SECTION 3: FULL CODING
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
    topic: 'Arrays & Logic',
    difficulty: 'boss',
    points: 120,
    problem_statement: `The dungeon consists of N rooms, each containing an energy crystal.
The strength of each crystal is given as an array.
Your task is to determine the maximum sum of any contiguous sequence of rooms.

**Input**
N
Array

**Output**
Maximum energy.

**Example**
Input:
\`8\`
\`-2 -3 4 -1 -2 1 5 -3\`
Output:
\`7\``,
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
}

run();
