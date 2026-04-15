import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugAll() {
    console.log("--- TODOS LOS PAGOS SIN CERRAR (Global) ---");
    const { data: p, error } = await supabase.from('payments').select('*').is('cash_closing_id', null).order('created_at', {ascending: false});
    if (error) console.error(error);
    else console.table(p.map(x => ({ 
        id: x.id, 
        created_at: x.created_at, 
        date: x.date, 
        monto: x.amount, 
        desc: x.description?.substring(0, 20) 
    })));

    console.log("\n--- PAGOS DE HOY (Vía created_at) ---");
    const today = new Date().toISOString().split('T')[0];
    const { data: p2 } = await supabase.from('payments').select('*').gte('created_at', today).order('created_at', {ascending: false});
    console.table(p2.map(x => ({ 
        id: x.id, 
        closing: x.cash_closing_id, 
        created_at: x.created_at, 
        monto: x.amount, 
        desc: x.description?.substring(0, 20) 
    })));
}

debugAll();
