import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function migrateCommissions() {
    console.log("=== INICIANDO REGULARIZACIÓN DE COMISIONES HISTÓRICAS ===");

    // 1. Obtener datos necesarios
    const { data: employees } = await supabase.from('employees').select('*');
    const { data: qServices } = await supabase.from('daily_quick_services').select('*, daily_quick_service_assignments(*)');
    const { data: workOrders } = await supabase.from('work_orders').select('*, work_order_assignments(*)');
    const { data: existingEarnings } = await supabase.from('employee_earnings').select('*');

    const earningsToInsert = [];

    // 2. Regularizar Gomería
    console.log("Auditando Servicios Rápidos (Gomería)...");
    for (const qs of (qServices || [])) {
        const assignments = qs.daily_quick_service_assignments || [];
        if (assignments.length === 0) continue;

        const mechanicsCount = assignments.length;
        // Asumimos que el precio de Gomería es mayormente mano de obra si no hay items 
        // (En la lógica de AppContext ya filtramos items, aquí usaremos el precio guardado)
        const laborShare = (parseFloat(qs.price) || 0) / mechanicsCount;

        for (const a of assignments) {
            const hasEarning = existingEarnings?.some(ee => ee.quick_service_id === qs.id && ee.employee_id === a.employee_id);
            if (!hasEarning) {
                const emp = employees?.find(e => e.id === a.employee_id);
                const rate = emp ? parseFloat(emp.commission_rate) || 0 : 0;
                const earned = laborShare * (rate / 100);

                if (earned > 0) {
                    earningsToInsert.push({
                        employee_id: a.employee_id,
                        quick_service_id: qs.id,
                        amount_earned: earned,
                        description: `[MIGRACIÓN] Comisión Gomería split ${mechanicsCount}: ${qs.service_type || 'Servicio'}`
                    });
                }
            }
        }
    }

    // 3. Regularizar OTs
    console.log("Auditando Órdenes de Trabajo (OT)...");
    for (const wo of (workOrders || [])) {
        if (wo.status !== 'Finalizado' && wo.status !== 'Cobrado') continue;

        const assignments = wo.work_order_assignments || [];
        if (assignments.length === 0) continue;

        const mechanicsCount = assignments.length;
        const laborShare = (parseFloat(wo.labor_cost) || 0) / mechanicsCount;

        for (const a of assignments) {
            const hasEarning = existingEarnings?.some(ee => ee.work_order_id === wo.id && ee.employee_id === a.mechanic_id);
            if (!hasEarning) {
                const emp = employees?.find(e => e.id === a.mechanic_id);
                const rate = (a.labor_commission_percent !== undefined && a.labor_commission_percent !== null) 
                    ? parseFloat(a.labor_commission_percent) 
                    : (emp ? parseFloat(emp.commission_rate) : 0);
                
                const earned = laborShare * (rate / 100);

                if (earned > 0) {
                    earningsToInsert.push({
                        employee_id: a.mechanic_id,
                        work_order_id: wo.id,
                        amount_earned: earned,
                        description: `[MIGRACIÓN] Comisión OT #${wo.order_number} split ${mechanicsCount}`
                    });
                }
            }
        }
    }

    // 4. Insertar en lotes
    if (earningsToInsert.length > 0) {
        console.log(`Insertando ${earningsToInsert.length} registros de ganancias...`);
        const { error } = await supabase.from('employee_earnings').insert(earningsToInsert);
        if (error) console.error("Error al insertar:", error);
        else console.log("¡Regularización completada con éxito!");
    } else {
        console.log("No se encontraron registros pendientes de regularizar.");
    }
}

migrateCommissions();
