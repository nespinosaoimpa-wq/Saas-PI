import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function listTables() {
    const { data, error } = await supabase.from('inventory').select('id').limit(1);
    if (error) console.log("Inventory Error:", error.message);
    else console.log("Inventory Exists");

    const { data: d2, error: e2 } = await supabase.from('daily_quick_services').select('id').limit(1);
    if (e2) console.log("Daily Quick Services Error:", e2.message);
    else console.log("Daily Quick Services Exists");

    const { data: d3, error: e3 } = await supabase.from('work_orders').select('id').limit(1);
    if (e3) console.log("Work Orders Error:", e3.message);
    else console.log("Work Orders Exists");
}

listTables();
