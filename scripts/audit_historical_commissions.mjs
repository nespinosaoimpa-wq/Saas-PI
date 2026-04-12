import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function auditHistoricalCommissions() {
    console.log("=== Auditing Historical Commissions ===");

    // 1. Fetch data
    const { data: assignments } = await supabase.from('work_order_assignments').select('*, work_orders(*)');
    const { data: quickServices } = await supabase.from('daily_quick_services').select('*, daily_quick_service_assignments(*)');
    const { data: earnings } = await supabase.from('employee_earnings').select('*');

    console.log(`Assignments: ${assignments?.length}`);
    console.log(`Quick Services: ${quickServices?.length}`);
    console.log(`Earnings Records: ${earnings?.length}`);

    // Audit Quick Services vs Earnings
    const orphanedQuickServices = quickServices?.filter(qs => 
        !earnings?.some(e => e.quick_service_id === qs.id)
    );

    if (orphanedQuickServices?.length > 0) {
        console.log(`\n[WARNING] Found ${orphanedQuickServices.length} Quick Services WITHOUT earnings records.`);
        console.log("These will show as $0 in the new commission logic.");
    }

    // Audit Multi-Mechanic OTs
    const otMap = {};
    assignments?.forEach(a => {
        if (!otMap[a.work_order_id]) otMap[a.work_order_id] = [];
        otMap[a.work_order_id].push(a);
    });

    const multiAssignments = Object.values(otMap).filter(arr => arr.length > 1);
    console.log(`\nOTs with multiple mechanics: ${multiAssignments.length}`);
    
    if (multiAssignments.length > 0) {
        console.log("The new 'split' logic will change historical data for these orders.");
    }

    console.log("\n=== Audit Finished ===");
}

auditHistoricalCommissions();
