require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testRPC() {
  const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1 AS ok;' });
  console.log("RPC Data:", data);
  console.log("RPC Error:", error);
}

testRPC();
