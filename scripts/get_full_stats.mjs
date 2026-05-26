import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log("Iniciando extracción de estadísticas de base de datos...");
    const stats = {};

    try {
        // 1. Clientes
        const { data: clients, error: cErr } = await supabase.from('clients').select('*');
        if (cErr) throw cErr;
        stats.totalClients = clients.length;
        stats.frequentClients = clients.filter(c => c.is_frequent).length;

        // 2. Vehículos
        const { data: vehicles, error: vErr } = await supabase.from('vehicles').select('*');
        if (vErr) throw vErr;
        stats.totalVehicles = vehicles.length;

        // 3. Órdenes de Trabajo (work_orders)
        const { data: wOrders, error: woErr } = await supabase.from('work_orders').select('*');
        if (woErr) throw woErr;
        stats.totalWorkOrders = wOrders.length;
        stats.workOrdersByStatus = wOrders.reduce((acc, curr) => {
            const status = curr.status || 'Desconocido';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        stats.totalWorkOrdersRevenue = wOrders
            .filter(wo => wo.status === 'Cobrado' || wo.status === 'Finalizado')
            .reduce((sum, wo) => sum + (parseFloat(wo.total_price) || 0), 0);

        // 4. Pagos y Movimientos de Caja
        const { data: payments, error: pErr } = await supabase.from('payments').select('*');
        if (pErr) throw pErr;
        stats.totalPaymentsCount = payments.length;
        stats.revenueByType = payments.reduce((acc, curr) => {
            const type = curr.type || 'INGRESO';
            const amt = parseFloat(curr.amount) || 0;
            acc[type] = (acc[type] || 0) + amt;
            return acc;
        }, { INGRESO: 0, EGRESO: 0 });

        stats.revenueByMethod = payments
            .filter(p => p.type === 'INGRESO')
            .reduce((acc, curr) => {
                const method = curr.method || curr.payment_method || 'EFECTIVO';
                acc[method] = (acc[method] || 0) + (parseFloat(curr.amount) || 0);
                return acc;
            }, {});

        // 5. Ventas Express de Gomería (daily_quick_services)
        let quickServices = [];
        try {
            const { data: qs, error: qsErr } = await supabase.from('daily_quick_services').select('*');
            if (!qsErr) quickServices = qs || [];
        } catch (e) {
            console.log("Nota: daily_quick_services no disponible o vacía");
        }
        stats.totalQuickServices = quickServices.length;
        stats.quickServicesRevenue = quickServices.reduce((sum, qs) => sum + (parseFloat(qs.price) || 0), 0);

        // 6. Inventario
        const { data: inventory, error: iErr } = await supabase.from('inventory').select('*');
        if (iErr) throw iErr;
        stats.totalInventoryItems = inventory.length;
        stats.inventoryValue = inventory.reduce((sum, item) => {
            const price = parseFloat(item.sell_price) || 0;
            const qty = item.stock_type === 'UNIT' ? (parseInt(item.stock_quantity) || 0) : ((parseFloat(item.stock_ml) || 0) / 1000);
            return sum + (price * qty);
        }, 0);

        // 7. Empleados y Asistencia
        const { data: employees, error: empErr } = await supabase.from('employees').select('*');
        if (empErr) throw empErr;
        stats.totalEmployees = employees.length;

        let attendanceCount = 0;
        try {
            const { data: att, error: attErr } = await supabase.from('attendance_logs').select('id');
            if (!attErr) attendanceCount = att.length;
        } catch (e) {
            console.log("Nota: attendance_logs no disponible");
        }
        stats.totalAttendanceLogs = attendanceCount;

        // 8. Clics en la interfaz (Métricas de uso del Mapa de Calor)
        let buttonClicks = 0;
        try {
            const { data: clicks, error: clErr } = await supabase.from('button_clicks').select('count');
            if (!clErr) buttonClicks = clicks.reduce((sum, c) => sum + (c.count || 0), 0);
        } catch (e) {
            console.log("Nota: button_clicks no disponible");
        }
        stats.totalUserActions = buttonClicks;

        // Guardar resultado
        fs.writeFileSync('scripts/results.json', JSON.stringify(stats, null, 2));
        console.log("Estadísticas extraídas exitosamente en scripts/results.json");
        console.log(stats);

    } catch (error) {
        console.error("Error durante la extracción:", error.message);
    }
}

run();
