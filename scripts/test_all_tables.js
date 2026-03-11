import { createClient } from '@supabase/supabase-js';

const URL = 'https://oanurhkxqdxtqoauiizy.supabase.co';
const KEY = 'sb_publishable_DlDSyq8nUsw5D-SkGd6dyw_9rULN-gE';
const supabase = createClient(URL, KEY);

const tables = [
    { name: 'clients', query: supabase.from('clients').select('id').limit(1) },
    { name: 'vehicles', query: supabase.from('vehicles').select('id').limit(1) },
    { name: 'work_orders', query: supabase.from('work_orders').select('id').limit(1) },
    { name: 'inventory', query: supabase.from('inventory').select('id').limit(1) },
    { name: 'suppliers', query: supabase.from('suppliers').select('id').limit(1) },
    { name: 'boxes', query: supabase.from('boxes').select('id').limit(1) },
    { name: 'vehicle_notes', query: supabase.from('vehicle_notes').select('id').limit(1) },
    { name: 'payments', query: supabase.from('payments').select('id').limit(1) },
    { name: 'cash_closings', query: supabase.from('cash_closings').select('id').limit(1) },
    { name: 'appointments', query: supabase.from('appointments').select('id').limit(1) },
    { name: 'promotions', query: supabase.from('promotions').select('id').limit(1) },
    { name: 'work_order_assignments', query: supabase.from('work_order_assignments').select('id').limit(1) },
];

async function run() {
    let hasError = false;
    for (const t of tables) {
        process.stdout.write(`Testing table ${t.name}... `);
        const { error } = await t.query;
        if (error) {
            console.log("❌ ERROR:", error.message);
            console.log(error);
            hasError = true;
        } else {
            console.log("✅ OK");
        }
    }
}

run();
