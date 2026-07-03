const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'd:/CodeDungeon/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const { data } = await supabase.from('rooms').select('*').order('room_order');
  console.log(JSON.stringify(data, null, 2));
}
run();
