import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function runAudit() {
    console.log('Iniciando extracción profunda para auditoría...');

    // 1. Pagos de hoy (2026-09-17) y totales
    const { data: allPayments, error: pErr } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (pErr) console.error('Error payments:', pErr);

    const todayPayments = (allPayments || []).filter(p => {
        const d = p.date || p.payment_date || (p.created_at ? p.created_at.substring(0, 10) : '');
        return d === '2026-09-17';
    });

    // 2. Servicios rápidos de hoy y totales
    const { data: allQS, error: qsErr } = await supabase.from('daily_quick_services').select('*').order('created_at', { ascending: false });
    if (qsErr) console.error('Error quick services:', qsErr);

    const todayQS = (allQS || []).filter(qs => {
        const d = qs.created_at ? qs.created_at.substring(0, 10) : '';
        return d === '2026-09-17';
    });

    // 3. Órdenes de trabajo
    const { data: allWO, error: woErr } = await supabase.from('work_orders').select('*').order('created_at', { ascending: false });
    if (woErr) console.error('Error work orders:', woErr);

    const todayWO = (allWO || []).filter(wo => {
        const d = wo.created_at ? wo.created_at.substring(0, 10) : '';
        return d === '2026-09-17';
    });

    // 4. Asistencias de hoy y totales
    const { data: allAtt, error: attErr } = await supabase.from('attendance_logs').select('*, employees(*)').order('created_at', { ascending: false });
    if (attErr) console.error('Error attendance:', attErr);

    const todayAtt = (allAtt || []).filter(a => {
        const d = (a.timestamp || a.created_at || '').substring(0, 10);
        return d === '2026-09-17';
    });

    // 5. Cierres de caja
    const { data: allCash, error: ccErr } = await supabase.from('cash_closings').select('*').order('created_at', { ascending: false });
    if (ccErr) console.error('Error cash closings:', ccErr);

    // 6. Clientes y Vehículos
    const { data: clients } = await supabase.from('clients').select('id, name, phone, is_frequent, created_at');
    const { data: vehicles } = await supabase.from('vehicles').select('id, plate, brand, model, client_id, created_at');

    // 7. Empleados
    const { data: employees } = await supabase.from('employees').select('*');

    // 8. Heatmap / Clics
    const { data: clicks } = await supabase.from('button_clicks').select('*');

    // 9. Auditorías
    const { data: audits } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20);

    const reportData = {
        today: {
            date: '2026-09-17',
            paymentsCount: todayPayments.length,
            paymentsTotal: todayPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
            paymentsList: todayPayments.map(p => ({
                id: p.id,
                time: p.created_at,
                amount: p.amount,
                method: p.method,
                description: p.description,
                employee_id: p.employee_id
            })),
            quickServicesCount: todayQS.length,
            quickServicesTotal: todayQS.reduce((acc, qs) => acc + (parseFloat(qs.price) || 0), 0),
            quickServicesList: todayQS.map(qs => ({
                id: qs.id,
                time: qs.created_at,
                service: qs.service_type,
                price: qs.price,
                mechanic_id: qs.mechanic_id
            })),
            attendanceCount: todayAtt.length,
            attendanceList: todayAtt.map(a => ({
                time: a.timestamp || a.created_at,
                type: a.type,
                name: a.employee_name || (a.employees ? a.employees.name : 'Desconocido'),
                time_display: a.time_display
            }))
        },
        historical: {
            totalRevenue: (allPayments || []).filter(p => p.type === 'INGRESO' || p.payment_type === 'INCOME').reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0),
            paymentsByMethod: (allPayments || []).reduce((acc, p) => {
                const m = p.method || p.payment_method || 'EFECTIVO';
                acc[m] = (acc[m] || 0) + (parseFloat(p.amount) || 0);
                return acc;
            }, {}),
            totalWorkOrders: (allWO || []).length,
            totalWorkOrdersVolume: (allWO || []).reduce((acc, wo) => acc + (parseFloat(wo.total_price) || 0), 0),
            totalQuickServices: (allQS || []).length,
            totalQuickServicesVolume: (allQS || []).reduce((acc, qs) => acc + (parseFloat(qs.price) || 0), 0),
            totalClients: (clients || []).length,
            totalVehicles: (vehicles || []).length,
            totalEmployees: (employees || []).length,
            totalAttendanceLogs: (allAtt || []).length,
            totalClicks: (clicks || []).reduce((sum, c) => sum + (c.count || 0), 0),
            clicksByPage: (clicks || []).reduce((acc, c) => {
                acc[c.page] = (acc[c.page] || 0) + (c.count || 0);
                return acc;
            }, {})
        },
        employees: employees || []
    };

    fs.writeFileSync('scripts/audit_extracted_data.json', JSON.stringify(reportData, null, 2));
    console.log('✅ Extracción completa guardada en scripts/audit_extracted_data.json');
}

runAudit();
