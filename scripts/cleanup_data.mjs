import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_DATE = '2026-03-14';

async function cleanup() {
    console.log(`Starting cleanup of records prior to ${TARGET_DATE}...`);

    // 1. Delete old payments FIRST to avoid FK violations
    const { error: pError } = await supabase
        .from('payments')
        .delete()
        .lt('created_at', TARGET_DATE);
    
    if (pError) console.error('Error deleting old payments:', pError.message);
    else console.log('✅ Old payments deleted.');

    // 2. Delete old work orders
    const { error: woError } = await supabase
        .from('work_orders')
        .delete()
        .lt('created_at', TARGET_DATE);
    
    if (woError) console.error('Error deleting old work orders:', woError.message);
    else console.log('✅ Old work orders deleted.');

    // 3. Delete old cash closings
    const { error: ccError } = await supabase
        .from('cash_closings')
        .delete()
        .lt('date', TARGET_DATE);
    
    if (ccError) console.error('Error deleting old cash closings:', ccError.message);
    else console.log('✅ Old cash closings deleted.');

    // 4. Delete old quick services - check if table exists first or just try-catch
    try {
        const { error: qsError } = await supabase
            .from('daily_quick_services')
            .delete()
            .lt('created_at', TARGET_DATE);
        
        if (qsError) {
            if (qsError.code === 'PGRST116' || qsError.message.includes('not found')) {
                console.log('ℹ️ Table daily_quick_services not found, skipping.');
            } else {
                console.error('Error deleting old quick services:', qsError.message);
            }
        }
        else console.log('✅ Old quick services deleted.');
    } catch (e) {
        console.log('ℹ️ Could not access daily_quick_services.');
    }

    console.log('Cleanup finished.');
}

cleanup();
