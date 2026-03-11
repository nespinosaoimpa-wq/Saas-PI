import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oanurhkxqdxtqoauiizy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbnVyaGtxcWR4dHFvYXVpaXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNjQ3NDEsImV4cCI6MjA1Njg0MDc0MX0.mO3XJpInK-nPh8m0QW3T1J-7_1_18Q_5P_Wv_X-X_X_X';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('--- Diagnóstico de Tablas Supabase (ESM) ---');
    const tables = [
        'clients', 'vehicles', 'work_orders', 'inventory', 'suppliers', 'boxes',
        'payments', 'cash_closings', 'appointments', 'promotions', 'work_order_assignments',
        'vehicle_health', 'brands', 'daily_work_log', 'daily_quick_services',
        'service_history', 'employee_earnings', 'employees'
    ];

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ [${table}]: ERROR - ${error.message}`);
        } else {
            console.log(`✅ [${table}]: OK - ${count || 0} registros`);
        }
    }
}

debug();
