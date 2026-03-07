import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK } from '../data/data';

const AppContext = createContext();

const SHEETS_WEBHOOK_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL || '';

export const AppProvider = ({ children }) => {
    const [data, setData] = useState({
        clients: [],
        vehicles: [],
        workOrders: [],
        inventory: [],
        suppliers: [],
        boxes: MOCK.boxes,
        vehicleNotes: [],
        payments: [],
        cashClosings: [],
        appointments: [],
        promotions: [],
        assignments: [],
        vehicleHealth: [],
        brands: [],
        dailyWorkLog: [],
        dailyQuickServices: [],
        serviceHistory: [],
        employeeEarnings: [],
        employees: [],
        activityLog: []
    });
    const [loading, setLoading] = useState(true);

    // =========================================
    // Sincronización con Google Sheets
    // =========================================
    const syncToSheets = async (payload) => {
        try {
            // Enviamos los datos al Webhook de Google Apps Script
            const response = await fetch(SHEETS_WEBHOOK_URL, {
                method: 'POST',
                mode: 'no-cors', // Importante para Google Apps Script Webhooks
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    ...payload
                })
            });
            console.log('✅ Sincronizado con Google Sheets');
        } catch (e) {
            console.error('❌ Error sincronizando con Sheets:', e);
        }
    };

    const loadData = async () => {
        if (!supabase) return;
        setLoading(true);

        const fetchTable = async (table, select = '*') => {
            try {
                const { data, error } = await supabase.from(table).select(select);
                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn(`⚠️ Error cargando tabla [${table}]:`, e.message);
                return [];
            }
        };

        try {
            const [
                clients, vehicles, workOrders, inventory, suppliers, boxes,
                vehicleNotes, payments, cashClosings, appointments, promotions,
                assignments, vehicleHealth, brands, dailyWorkLog,
                dailyQuickServices, serviceHistory, employeeEarnings, employees
            ] = await Promise.all([
                fetchTable('clients'),
                fetchTable('vehicles'),
                supabase.from('work_orders').select('*, clients(*), vehicles(*)').order('created_at', { ascending: false }).then(r => r.data || []),
                fetchTable('inventory'),
                fetchTable('suppliers'),
                fetchTable('boxes'),
                supabase.from('vehicle_notes').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
                supabase.from('payments').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
                supabase.from('cash_closings').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
                supabase.from('appointments').select('*').order('date', { ascending: true }).then(r => r.data || []),
                supabase.from('promotions').select('*').order('created_at', { ascending: false }).then(r => r.data || []),
                fetchTable('work_order_assignments'),
                fetchTable('vehicle_health'),
                fetchTable('brands'),
                fetchTable('daily_work_log'),
                fetchTable('daily_quick_services'),
                fetchTable('service_history'),
                fetchTable('employee_earnings'),
                fetchTable('employees')
            ]);

            setData({
                clients, vehicles, workOrders, inventory, suppliers,
                boxes: boxes.length ? boxes : MOCK.boxes,
                vehicleNotes, payments, cashClosings, appointments,
                promotions, assignments, vehicleHealth, brands,
                dailyWorkLog, dailyQuickServices, serviceHistory, employeeEarnings,
                employees,
                activityLog: []
            });
        } catch (e) {
            console.error('CRITICAL: Error in bulk load', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();

        // =========================================
        // Configuración de Realtime (Live Updates)
        // =========================================
        if (!supabase) return; // Guard: sin Supabase no hay Realtime

        let channel;
        try {
            channel = supabase
                .channel('db-changes')
                .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                    console.log('🔄 Cambio detectado en DB:', payload);
                    loadData();
                })
                .subscribe();
        } catch (e) {
            console.warn('⚠️ No se pudo iniciar Realtime:', e.message);
        }

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    // ==========================================
    // Helpers
    // ==========================================
    const getClient = (id) => (data.clients || []).find(c => c.id === id);
    const getVehicle = (id) => (data.vehicles || []).find(v => v.id === id);
    const getClientVehicles = (clientId) => (data.vehicles || []).filter(v => v && v.client_id === clientId);
    const getLowStockItems = () => (data.inventory || []).filter(i =>
        (i && i.stock_type === 'UNIT' && i.stock_quantity <= i.stock_min) ||
        (i && i.stock_type === 'VOLUME' && i.stock_ml <= i.stock_min_ml)
    );

    const addQuickService = async (action, isSecondOrMore = false, mechanicId = null, clientId = null, vehicleId = null) => {
        const finalPrice = isSecondOrMore ? action.price * 0.7 : action.price;

        try {
            // 1. Persistir en la tabla de servicios rápidos
            const { data: newService, error } = await supabase.from('daily_quick_services').insert([{
                service_type: action.label,
                price: finalPrice,
                mechanic_id: mechanicId,
                client_id: clientId,
                vehicle_id: vehicleId,
                notes: isSecondOrMore ? 'Descuento por cantidad aplicado' : null
            }]).select().single();

            if (error) throw error;

            // 2. Registrar pago automático
            if (finalPrice > 0) {
                await addPayment({
                    amount: finalPrice,
                    method: 'EFECTIVO',
                    description: `Gomería Express: ${action.label}`,
                    type: 'INGRESO',
                    reference: 'DIRECTO'
                });

                // Respaldo en Sheets
                syncToSheets({
                    type: 'GOMERIA',
                    service: action.label,
                    amount: finalPrice,
                    mechanic: mechanicId
                });
            }

            // 3. Registrar comisión para el empleado (ej: 50% para gomería según política típica)
            if (mechanicId && finalPrice > 0) {
                await supabase.from('employee_earnings').insert([{
                    employee_id: mechanicId,
                    quick_service_id: newService.id,
                    amount_earned: finalPrice * 0.5, // 50% comisión gomería
                    description: `Comisión Gomería: ${action.label}`
                }]);
            }

            // 4. Actualizar estado local
            setData(prev => ({
                ...prev,
                dailyQuickServices: [newService, ...(prev.dailyQuickServices || [])],
                activityLog: [{ label: action.label, price: finalPrice, timestamp: new Date().toISOString() }, ...(prev.activityLog || [])]
            }));

        } catch (e) {
            console.error("Error registering express service", e);
            alert("Error al registrar servicio rápido: " + e.message);
        }
    };

    const exportToExcel = (dataType) => {
        let rows = [];
        let filename = 'export.csv';

        if (dataType === 'payments') {
            rows = data.payments.map(p => ({
                Fecha: p.date ? new Date(p.date).toLocaleString('es-AR') : '',
                Monto: p.amount,
                Metodo: p.method,
                Tipo: p.type,
                Descripcion: p.description
            }));
            filename = `movimientos_caja_${new Date().toISOString().split('T')[0]}.csv`;
        } else if (dataType === 'inventory') {
            rows = data.inventory.map(i => ({
                Producto: i.name,
                Marca: i.brand,
                Precio_Venta: i.sell_price,
                Stock: i.stock_type === 'UNIT' ? i.stock_quantity : i.stock_ml,
                Tipo: i.stock_type
            }));
            filename = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
        } else if (dataType === 'sales') {
            rows = data.payments.filter(p => p.type === 'INGRESO' && p.description?.includes('Venta Libre')).map(s => ({
                Fecha: s.date ? new Date(s.date).toLocaleString('es-AR') : '',
                Monto_Total: s.amount,
                Metodo_Pago: s.method,
                Cajero: s.cashier_id || 'LOCAL',
                Detalle: s.description
            }));
            filename = `punto_de_venta_${new Date().toISOString().split('T')[0]}.csv`;
        } else if (dataType === 'work_orders') {
            rows = data.workOrders.map(wo => {
                const client = data.clients?.find(c => c.id === wo.client_id);
                return {
                    Nro_Orden: wo.order_number,
                    Fecha_Ingreso: wo.created_at ? new Date(wo.created_at).toLocaleDateString('es-AR') : '',
                    Cliente: client ? `${client.first_name} ${client.last_name}` : 'N/A',
                    Descripcion: wo.description,
                    Estado: wo.status,
                    Total: wo.total_price || 0
                };
            });
            filename = `ordenes_trabajo_${new Date().toISOString().split('T')[0]}.csv`;
        } else if (dataType === 'appointments') {
            rows = data.appointments.map(a => ({
                Fecha: a.date,
                Hora: a.time,
                Motivo: a.title,
                Cliente: a.client,
                Vehiculo: a.vehicle,
                Box: a.box,
                Estado: a.status
            }));
            filename = `turnos_${new Date().toISOString().split('T')[0]}.csv`;
        }

        if (rows.length === 0) return alert('No hay datos para exportar');

        const headers = Object.keys(rows[0]).join(';');
        const csvContent = [headers, ...rows.map(r => Object.values(r).join(';'))].join('\n');

        // Prefixing with BOM (\uFEFF) forces Excel to read the file in UTF-8
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Historial unificado: OTs finalizadas + notas manuales
    const getVehicleHistory = (vehicleId) => {
        const otEntries = (data.workOrders || [])
            .filter(wo => wo && wo.vehicle_id === vehicleId && (wo.status === 'Finalizado' || wo.status === 'Cobrado'))
            .map(wo => ({
                id: wo.id,
                date: wo.completed_at || wo.created_at,
                description: wo.description,
                km: wo.km_at_entry || 0,
                price: wo.total_price || 0,
                technician: wo.mechanic_id || 'N/A',
                source: 'OT',
                order_number: wo.order_number
            }));

        const noteEntries = (data.vehicleNotes || [])
            .filter(n => n && n.vehicle_id === vehicleId)
            .map(n => ({
                id: n.id,
                date: n.created_at,
                description: n.description,
                km: n.km || 0,
                price: n.cost || 0,
                technician: n.technician || '',
                source: 'NOTA'
            }));

        return [...otEntries, ...noteEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    // ==========================================
    // CRUD — Clientes
    // ==========================================
    const addClient = async (clientData) => {
        const { data: newClient, error } = await supabase
            .from('clients')
            .insert([{
                first_name: clientData.first_name,
                last_name: clientData.last_name,
                phone: clientData.phone,
                dni: clientData.dni,
                email: clientData.email || null,
                is_frequent: clientData.is_frequent || false
            }])
            .select()
            .single();

        if (error) { console.error("Error creating client", error); throw error; }

        // Respaldo en Sheets
        syncToSheets({
            type: 'CLIENTE_NUEVO',
            name: `${clientData.first_name} ${clientData.last_name}`,
            phone: clientData.phone,
            dni: clientData.dni
        });

        setData(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
        return newClient;
    };

    const updateClient = async (id, updates) => {
        const { data: updated, error } = await supabase
            .from('clients').update(updates).eq('id', id).select().single();
        if (error) { console.error("Error updating client", error); throw error; }
        setData(prev => ({ ...prev, clients: prev.clients.map(c => c.id === id ? { ...c, ...updated } : c) }));
        return updated;
    };

    // ==========================================
    // CRUD — Vehículos
    // ==========================================
    const addVehicle = async (vehicleData) => {
        const { data: newVehicle, error } = await supabase
            .from('vehicles')
            .insert([{
                client_id: vehicleData.client_id,
                license_plate: vehicleData.license_plate,
                brand: vehicleData.brand,
                model: vehicleData.model,
                year: parseInt(vehicleData.year) || null,
                km: parseInt(vehicleData.km) || 0,
                color: vehicleData.color || 'N/A',
                health_score: 100,
                difficulty_factor: 1.0
            }])
            .select()
            .single();

        if (error) { console.error("Error creating vehicle", error); throw error; }
        setData(prev => ({ ...prev, vehicles: [...prev.vehicles, newVehicle] }));
        return newVehicle;
    };

    const updateVehicle = async (id, updates) => {
        const { data: updated, error } = await supabase
            .from('vehicles').update(updates).eq('id', id).select().single();
        if (error) { console.error("Error updating vehicle", error); throw error; }
        setData(prev => ({ ...prev, vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...updated } : v) }));
        return updated;
    };

    // ==========================================
    // CRUD — Notas de Vehículo
    // ==========================================
    const addVehicleNote = async (noteData) => {
        const { data: newNote, error } = await supabase
            .from('vehicle_notes')
            .insert([{
                vehicle_id: noteData.vehicle_id,
                description: noteData.description,
                km: parseInt(noteData.km) || null,
                cost: parseFloat(noteData.cost) || 0,
                technician: noteData.technician || null,
                note_type: noteData.note_type || 'MANUAL'
            }])
            .select()
            .single();

        if (error) { console.error("Error creating vehicle note", error); throw error; }
        setData(prev => ({ ...prev, vehicleNotes: [newNote, ...prev.vehicleNotes] }));
        return newNote;
    };

    // ==========================================
    // CRUD — Proveedores
    // ==========================================
    const addSupplier = async (supplierData) => {
        const { data: newSupplier, error } = await supabase
            .from('suppliers')
            .insert([{
                name: supplierData.name,
                contact: supplierData.contact || '',
                phone: supplierData.phone || '',
                cuit: supplierData.cuit || '',
                category: supplierData.category || ''
            }])
            .select()
            .single();

        if (error) { console.error("Error creating supplier", error); throw error; }
        setData(prev => ({ ...prev, suppliers: [...prev.suppliers, newSupplier] }));
        return newSupplier;
    };

    const updateSupplier = async (id, updates) => {
        const { data: updated, error } = await supabase
            .from('suppliers')
            .update({
                name: updates.name,
                contact: updates.contact || '',
                phone: updates.phone || '',
                cuit: updates.cuit || '',
                category: updates.category || ''
            })
            .eq('id', id)
            .select()
            .single();

        if (error) { console.error("Error updating supplier", error); throw error; }
        setData(prev => ({ ...prev, suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...updated } : s) }));
        return updated;
    };

    // ==========================================
    // CRUD — Inventario
    // ==========================================
    const addInventoryItem = async (itemData) => {
        const { data: newItem, error } = await supabase.from('inventory').insert([itemData]).select().single();
        if (error) { console.error("Error creating inventory item", error); throw error; }

        // Respaldo en Sheets
        syncToSheets({
            type: 'INVENTARIO_NUEVO',
            item: itemData.name,
            stock: itemData.stock_type === 'UNIT' ? itemData.stock_quantity : itemData.stock_ml,
            price: itemData.sell_price
        });

        setData(prev => ({ ...prev, inventory: [...prev.inventory, newItem] }));
        return newItem;
    };

    const updateInventoryItem = async (id, updates) => {
        const { data: updated, error } = await supabase.from('inventory').update(updates).eq('id', id).select().single();
        if (error) { console.error("Error updating inventory item", error); throw error; }

        // Respaldo en Sheets
        syncToSheets({
            type: 'INVENTARIO_ACTUALIZACION',
            item: updated.name,
            stock: updated.stock_type === 'UNIT' ? updated.stock_quantity : updated.stock_ml,
            price: updated.sell_price
        });

        setData(prev => ({ ...prev, inventory: prev.inventory.map(i => i.id === id ? { ...i, ...updated } : i) }));
        return updated;
    };

    const deleteInventoryItem = async (id) => {
        const item = data.inventory.find(i => i.id === id);
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) { console.error("Error deleting inventory item", error); throw error; }

        // Respaldo en Sheets
        if (item) {
            syncToSheets({
                type: 'INVENTARIO_ELIMINADO',
                item: item.name
            });
        }

        setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id) }));
    };

    // ==========================================
    // Órdenes de Trabajo
    // ==========================================
    const addWorkOrder = async (woData) => {
        const { data: newWo, error } = await supabase.from('work_orders').insert([{
            client_id: woData.client_id,
            vehicle_id: woData.vehicle_id,
            box_id: woData.box_id || null,
            description: woData.description,
            km_at_entry: woData.km_at_entry || 0,
            labor_cost: woData.labor_cost,
            parts_cost: woData.parts_cost,
            total_price: woData.total_price,
            labor_profit_percent: woData.labor_profit_percent || 100,
            status: woData.box_id ? 'En Box' : 'Pendiente'
        }]).select('*, clients(*), vehicles(*)').single();

        if (!error && newWo) {
            // Asignar mecánicos si existen
            if (woData.mechanic_ids && woData.mechanic_ids.length > 0) {
                const assignments = woData.mechanic_ids.map(mid => ({
                    work_order_id: newWo.id,
                    mechanic_id: mid,
                    labor_commission_percent: woData.applied_commission_rate
                }));
                await supabase.from('work_order_assignments').insert(assignments);
            }

            // Respaldo en Sheets
            syncToSheets({
                type: 'ORDEN_NUEVA',
                order_number: newWo.order_number,
                description: woData.description,
                total: woData.total_price,
                status: newWo.status
            });

            await loadData();
            return newWo;
        }
        if (error) { console.error("Error creating WO", error); throw error; }
    };

    const updateWorkOrder = async (id, updates, afipData = null) => {
        const { error } = await supabase.from('work_orders').update(updates).eq('id', id);
        if (!error) {
            // Si la orden se finaliza o cobra, intentar crear el pago automáticamente en caja
            if (updates.status === 'Finalizado' || updates.status === 'Cobrado') {
                const wo = data.workOrders?.find(w => w.id === id);
                if (wo && wo.total_price > 0) {
                    try {
                        const existPayment = data.payments?.some(p => p.work_order_id === id);
                        if (!existPayment) {
                            await addPayment({
                                amount: wo.total_price,
                                method: 'EFECTIVO', // Asumimos efectivo por defecto al finalizar rápido
                                description: `Pago OT #${wo.order_number}`,
                                type: 'INGRESO',
                                reference: 'OT',
                                work_order_id: wo.id,
                                cae: afipData ? afipData.cae : null,
                                cae_due_date: afipData ? afipData.caeDueDate : null,
                                receipt_number: afipData ? afipData.receiptText : null
                            });
                        }
                    } catch (e) {
                        console.error('No se pudo automatizar el pago de la OT', e);
                    }
                }
            }

            setData(prev => ({
                ...prev,
                workOrders: prev.workOrders.map(wo => wo.id === id ? { ...wo, ...updates } : wo)
            }));
        }
    };

    // ==========================================
    // Promociones
    // ==========================================
    const addPromotion = async (promoData) => {
        const { data: newPromo, error } = await supabase.from('promotions').insert([promoData]).select().single();
        if (error) { console.error("Error creating promotion", error); throw error; }
        setData(prev => ({ ...prev, promotions: [newPromo, ...prev.promotions] }));
        return newPromo;
    };

    const deletePromotion = async (id) => {
        const { error } = await supabase.from('promotions').delete().eq('id', id);
        if (error) { console.error("Error deleting promotion", error); throw error; }
        setData(prev => ({ ...prev, promotions: prev.promotions.filter(p => p.id !== id) }));
    };

    const addAppointment = async (aptData) => {
        const { data: newApt, error } = await supabase.from('appointments').insert([aptData]).select().single();
        if (error) { console.error("Error creating appointment", error); throw error; }
        setData(prev => ({ ...prev, appointments: [...prev.appointments, newApt].sort((a, b) => a.date.localeCompare(b.date)) }));
        return newApt;
    };

    const deleteAppointment = async (id) => {
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) { console.error("Error deleting appointment", error); throw error; }
        setData(prev => ({ ...prev, appointments: prev.appointments.filter(a => a.id !== id) }));
    };

    // ==========================================
    // Facturación AFIP
    // ==========================================
    const generateAFIPInvoice = async (invoiceData) => {
        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5173' : '';
            const res = await fetch(`${baseUrl}/api/afip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData)
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            return data;
        } catch (error) {
            console.error('Error generando Factura AFIP:', error);
            throw error;
        }
    };

    // ==========================================
    // Pagos y Caja
    // ==========================================
    const addPayment = async (paymentData) => {
        const today = new Date().toISOString().split('T')[0];
        const { data: newPayment, error } = await supabase
            .from('payments')
            .insert([{
                amount: parseFloat(paymentData.amount),
                method: paymentData.method || 'EFECTIVO',
                date: today,
                reference: paymentData.reference || null,
                work_order_id: paymentData.work_order_id || null,
                description: paymentData.description || 'Ingreso',
                type: paymentData.type || 'INGRESO',
                employee_id: paymentData.employee_id || null,
                cae: paymentData.cae || null,
                cae_due_date: paymentData.cae_due_date || null,
                receipt_number: paymentData.receipt_number || null
            }])
            .select()
            .single();

        if (error) { console.error("Error adding payment", error); throw error; }

        // Respaldo en Sheets
        syncToSheets({
            type: 'CAJA_INGRESO',
            amount: parseFloat(paymentData.amount),
            method: paymentData.method || 'EFECTIVO',
            description: paymentData.description || 'Ingreso'
        });

        setData(prev => ({ ...prev, payments: [newPayment, ...prev.payments] }));
        return newPayment;
    };

    const addWithdrawal = async (withdrawalData) => {
        const today = new Date().toISOString().split('T')[0];
        const { data: newWithdrawal, error } = await supabase
            .from('payments')
            .insert([{
                amount: -Math.abs(parseFloat(withdrawalData.amount)),
                method: 'EFECTIVO',
                date: today,
                reference: null,
                description: withdrawalData.description || 'Retiro de caja',
                type: 'EGRESO',
                employee_id: withdrawalData.employee_id || null
            }])
            .select()
            .single();

        if (error) { console.error("Error adding withdrawal", error); throw error; }

        // Respaldo Egresos en Sheets
        syncToSheets({
            type: 'EGRESO',
            description: withdrawalData.description,
            amount: Math.abs(parseFloat(withdrawalData.amount)),
            method: 'EFECTIVO'
        });

        setData(prev => ({ ...prev, payments: [newWithdrawal, ...prev.payments] }));
        return newWithdrawal;
    };

    const performCashClose = async (closeData) => {
        const today = new Date().toISOString().split('T')[0];
        const { data: closing, error } = await supabase
            .from('cash_closings')
            .insert([{
                date: today,
                cash_income: closeData.cash_expected || 0,
                transfer_income: closeData.transfer_total || 0,
                card_income: closeData.card_total || 0,
                expected_cash: closeData.cash_expected || 0,
                actual_cash: closeData.cash_real || 0,
                difference: closeData.difference || 0,
                employee_id: closeData.employee_id || null
            }])
            .select()
            .single();

        if (error) { console.error("Error performing cash close", error); throw error; }

        // Respaldo en Sheets
        syncToSheets({
            type: 'CIERRE_CAJA',
            cash: closeData.cash_expected || 0,
            transfer: closeData.transfer_total || 0,
            card: closeData.card_total || 0,
            difference: closeData.difference || 0
        });

        setData(prev => ({ ...prev, cashClosings: [closing, ...prev.cashClosings] }));
        return closing;
    };

    // ==========================================
    // Punto de Venta — processSale
    // ==========================================
    const processSale = async (cart, payMethod) => {
        const total = cart.reduce((sum, ci) => sum + (ci.sell_price * ci.qty), 0);
        const today = new Date().toISOString().split('T')[0];

        // 1. Registrar el pago
        const { data: payment, error: payError } = await supabase
            .from('payments')
            .insert([{
                amount: total,
                method: payMethod,
                date: today,
                description: `Venta POS: ${cart.map(ci => `${ci.qty}x ${ci.name}`).join(', ')}`,
                type: 'VENTA',
                reference: null
            }])
            .select()
            .single();

        if (payError) { console.error("Error registering sale", payError); throw payError; }

        // 2. Descontar stock de cada item
        for (const ci of cart) {
            if (ci.stock_type === 'UNIT') {
                await supabase.from('inventory').update({
                    stock_quantity: Math.max(0, (ci.stock_quantity || 0) - ci.qty)
                }).eq('id', ci.id);
            }
            // Para VOLUME no descontamos en POS (sería por ml, lógica distinta)
        }

        // 3. Refresh data
        await loadData();
        return total;
    };

    // ==========================================
    // Comisiones
    // ==========================================
    const getCommissions = (technicianId) => {
        // 1. Comisiones por Órdenes de Trabajo (OT)
        const assignments = (data.assignments || []).filter(a => a.mechanic_id === technicianId);
        const otCommissions = assignments.reduce((sum, a) => {
            const wo = data.workOrders?.find(w => w.id === a.work_order_id);
            if (wo && (wo.status === 'Finalizado' || wo.status === 'Cobrado')) {
                const labor = parseFloat(wo.labor_base_price) || 0;
                // Buscar tasa real del empleado
                const emp = (data.employees || []).find(e => e.id === technicianId);
                const rate = emp ? parseFloat(emp.commission_rate) : (parseFloat(a.labor_commission_percent) || 10);
                return sum + (labor * (rate / 100));
            }
            return sum;
        }, 0);

        // 2. Comisiones por Servicios Rápidos (Gomería)
        const quickCommissions = (data.employeeEarnings || [])
            .filter(e => e.employee_id === technicianId && e.quick_service_id)
            .reduce((sum, e) => sum + (parseFloat(e.amount_earned) || 0), 0);

        return otCommissions + quickCommissions;
    };

    const getEmployeeProductivity = (employeeId) => {
        const assignments = (data.assignments || []).filter(a => a.mechanic_id === employeeId);
        const finished = assignments.filter(a => {
            const wo = data.workOrders?.find(w => w.id === a.work_order_id);
            return wo && (wo.status === 'Finalizado' || wo.status === 'Cobrado');
        });

        const totalGenerated = finished.reduce((sum, a) => {
            const wo = data.workOrders?.find(w => w.id === a.work_order_id);
            return sum + (parseFloat(wo.labor_cost) || 0);
        }, 0);

        return {
            count: finished.length,
            total_labor: totalGenerated,
            commission: getCommissions(employeeId)
        };
    };

    return (
        <AppContext.Provider value={{
            data,
            loading,
            refreshData: loadData,
            getClient,
            getVehicle,
            getClientVehicles,
            getLowStockItems,
            getVehicleHistory,
            addClient,
            updateClient,
            addVehicle,
            updateVehicle,
            addVehicleNote,
            addInventoryItem,
            updateInventoryItem,
            deleteInventoryItem,
            addSupplier,
            updateSupplier,
            addWorkOrder,
            updateWorkOrder,
            addPayment,
            addWithdrawal,
            performCashClose,
            processSale,
            getCommissions,
            getEmployeeProductivity,
            addQuickService,
            exportToExcel,
            addPromotion,
            deletePromotion,
            addAppointment,
            deleteAppointment,
            generateAFIPInvoice
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
