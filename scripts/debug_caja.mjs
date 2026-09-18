import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function verify() {
    const { data: unclosed } = await supabase
        .from('payments')
        .select('id')
        .is('cash_closing_id', null);

    console.log(`Unclosed payments remaining: ${unclosed ? unclosed.length : 0}`);

    const { data: latestClosing } = await supabase
        .from('cash_closings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    console.log("Latest cash closing:", latestClosing);
}

verify();
