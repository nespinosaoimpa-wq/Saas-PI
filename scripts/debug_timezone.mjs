import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debugTimezone() {
    console.log("--- PAGOS DE LAS ULTIMAS 48 HORAS ---");
    const { data: p } = await supabase.from('payments').select('*').order('created_at', {ascending: false}).limit(20);
    console.table(p.map(x => ({ 
        id: x.id, 
        closing: x.cash_closing_id, 
        created_at: x.created_at, 
        date: x.date,
        monto: x.amount, 
        desc: x.description?.substring(0, 30) 
    })));
}

debugTimezone();
