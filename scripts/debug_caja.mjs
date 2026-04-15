import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCaja() {
    const today = new Date().toLocaleDateString('en-CA');
    console.log(`Checking data for: ${today}`);

    // Check closings
    const { data: closings, error: cErr } = await supabase
        .from('cash_closings')
        .select('*, employees(name)')
        .eq('date', today)
        .order('created_at', { ascending: false });
    
    if (cErr) console.error("Error fetching closings:", cErr);
    else {
        console.log("\n--- CIERRES DE HOY ---");
        console.table(closings.map(c => ({
            id: c.id,
            creado: new Date(c.created_at).toLocaleTimeString(),
            esperado: c.expected_cash,
            real: c.actual_cash,
            usuario: c.employees?.name
        })));
    }

    // Check unclosed payments
    const { data: payments, error: pErr } = await supabase
        .from('payments')
        .select('*')
        .is('cash_closing_id', null)
        .eq('date', today)
        .order('created_at', { ascending: false });
    
    if (pErr) console.error("Error fetching unclosed payments:", pErr);
    else {
        console.log("\n--- PAGOS SIN CERRAR (ACTUALMENTE) ---");
        console.table(payments.map(p => ({
            creado: new Date(p.created_at).toLocaleTimeString(),
            monto: p.amount,
            usuario: p.employee_id,
            desc: p.description?.substring(0, 30)
        })));
    }
}

checkCaja();
