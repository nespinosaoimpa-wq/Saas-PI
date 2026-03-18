import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK } from '../data/data';
import * as XLSX from 'xlsx';

const AppContext = createContext();


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
        employees: [],
        activityLog: [],
        workOrderItems: []
    });
    const [loading, setLoading] = useState(true);

    // ==========================================
    // Fichaje Personal (Time Tracking)
    // ==========================================
    const [timeTrackingLogs, setTimeTrackingLogs] = useState([]);

    const addTimeLog = async (pin, type) => {
        if (!pin) throw new Error('Debe ingresar un PIN');
        
        const allEmployees = data.employees || [];
        const emp = allEmployees.find(e => String(e.pin) === String(pin));
        
        if (!emp) {
            throw new Error('PIN incorrecto. Empleado no encontrado.');
        }

        const now = new Date();
        const newLogData = {
            employee_id: emp.id,
            employee_name: emp.name || 'Empleado',
            type: type, // 'IN' or 'OUT'
            timestamp: now.toISOString(),
            time_display: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
        };

        // Persistir en Supabase (tabla attendance_logs)
        const { data: inserted, error } = await supabase
            .from('attendance_logs')
            .insert([newLogData])
            .select()
            .single();

        if (error) {
            console.error("Error saving attendance log", error);
            throw new Error('Error al registrar en la base de datos: ' + error.message);
        }

        // Update local state
        const updatedLog = inserted || { ...newLogData, id: Date.now().toString() };
        setTimeTrackingLogs(prev => [updatedLog, ...prev]);

        return { 
            log: updatedLog, 
            emp: emp, 
            time: updatedLog.time_display,
            name: emp.name || 'Empleado'
        };
    };

    const getActiveEmployees = () => {
        const active = [];
        const employees = data.employees || [];

        employees.forEach(emp => {
            const lastLog = timeTrackingLogs.find(l => l.employee_id === emp.id);
            if (lastLog && lastLog.type === 'IN') {
                active.push({
                    ...emp,
                    since: new Date(lastLog.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                    logged_at: lastLog.timestamp
                });
            }
        });
        return active.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
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
                assignments, employees, workOrderItems, dailyQuickServices, attendance_logs
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
                fetchTable('employees'),
                fetchTable('work_order_items'),
                fetchTable('daily_quick_services'),
                supabase.from('attendance_logs').select('*').order('timestamp', { ascending: false }).then(r => r.data || [])
            ]);


            setData({
                clients: clients.length ? clients : MOCK.clients,
                vehicles: vehicles.length ? vehicles : MOCK.vehicles,
                workOrders: workOrders.length ? workOrders : MOCK.workOrders,
                inventory: inventory.length ? inventory : MOCK.inventory,
                suppliers: suppliers.length ? suppliers : MOCK.suppliers,
                boxes: boxes.length ? boxes : MOCK.boxes,
                vehicleNotes, payments, cashClosings, appointments,
                promotions, assignments,
                employees: employees.length ? employees : MOCK.employees || [],
                workOrderItems: workOrderItems.length ? workOrderItems : [],
                dailyQuickServices: dailyQuickServices.length ? dailyQuickServices : [],
                // Tablas opcionales (pueden no existir)
                vehicleHealth: [], brands: [],
                dailyWorkLog: [], serviceHistory: [], employeeEarnings: [],
                activityLog: []
            });
            setTimeTrackingLogs(attendance_logs);
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

    const addQuickService = async (action, isSecondOrMore = false, mechanicId = null, clientId = null, vehicleId = null, paymentOptions = { method: 'EFECTIVO', combinedAmounts: null }, overrideTotal = null) => {
        const finalPrice = overrideTotal !== null ? overrideTotal : (isSecondOrMore ? action.price * 0.5 : action.price);

        try {
            // 1. Intentar persistir en tabla de servicios rápidos (puede no existir)
            let newService = null;
            try {
                const { data, error } = await supabase.from('daily_quick_services').insert([{
                    service_type: action.label,
                    price: finalPrice,
                    mechanic_id: mechanicId,
                    client_id: clientId,
                    vehicle_id: vehicleId,
                    notes: isSecondOrMore ? 'Descuento por cantidad aplicado' : null
                }]).select().single();
                if (!error) newService = data;
            } catch (e) {
                console.warn('Tabla daily_quick_services no disponible, continuando...', e.message);
            }

            // 2. Registrar pago automático en caja (siempre funciona)
            if (finalPrice > 0) {
                if (paymentOptions.method === 'COMBINADO' && paymentOptions.combinedAmounts) {
                    for (const [method, amount] of Object.entries(paymentOptions.combinedAmounts)) {
                        const amt = parseFloat(amount);
                        if (amt > 0) {
                            await addPayment({
                                amount: amt,
                                method: method,
                                description: `Gomería Express (${method}): ${action.label}`,
                                type: 'INGRESO',
                                reference: 'DIRECTO',
                                employee_id: mechanicId || null
                            });
                        }
                    }
                } else {
                    await addPayment({
                        amount: finalPrice,
                        method: paymentOptions.method,
                        description: `Gomería Express: ${action.label}`,
                        type: 'INGRESO',
                        reference: 'DIRECTO',
                        employee_id: mechanicId || null
                    });
                }

            }

            // 3. Actualizar estado local
            setData(prev => ({
                ...prev,
                dailyQuickServices: [newService || { id: Date.now().toString(), service_type: action.label, price: finalPrice, mechanic_id: mechanicId, created_at: new Date().toISOString() }, ...(prev.dailyQuickServices || [])],
                activityLog: [{ label: action.label, price: finalPrice, timestamp: new Date().toISOString(), mechanic_id: mechanicId }, ...(prev.activityLog || [])]
            }));

        } catch (e) {
            console.error("Error registering express service", e);
            alert("Error al registrar servicio rápido: " + e.message);
        }
    };

    const exportToExcel = (dataType) => {
        let rows = [];
        let filename = 'export.xlsx';

        if (dataType === 'payments') {
            rows = (data.payments || []).map(p => ({
                Fecha: p.date ? new Date(p.date).toLocaleString('es-AR') : '',
                Monto: p.amount,
                Metodo: p.method || p.payment_method || 'EFECTIVO',
                Tipo: p.type || (p.amount < 0 ? 'EGRESO' : 'INGRESO'),
                Descripcion: p.description || ''
            }));
            filename = `movimientos_caja_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (dataType === 'inventory') {
            rows = (data.inventory || []).map(i => ({
                Producto: i.name || '',
                Marca: i.brand || '',
                Precio_Venta: i.sell_price || 0,
                Stock: i.stock_type === 'UNIT' ? (i.stock_quantity || 0) : (i.stock_ml || 0),
                Tipo: i.stock_type || 'UNIT'
            }));
            filename = `inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (dataType === 'sales') {
            rows = (data.payments || []).filter(p => p.type === 'INGRESO' && p.description?.includes('Venta')).map(s => ({
                Fecha: s.date ? new Date(s.date).toLocaleString('es-AR') : '',
                Monto_Total: s.amount,
                Metodo_Pago: s.method || s.payment_method || '',
                Cajero: s.cashier_id || 'LOCAL',
                Detalle: s.description || ''
            }));
            filename = `punto_de_venta_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (dataType === 'work_orders') {
            rows = (data.workOrders || []).map(wo => {
                const client = data.clients?.find(c => c.id === wo.client_id);
                return {
                    Nro_Orden: wo.order_number || '',
                    Fecha_Ingreso: wo.created_at ? new Date(wo.created_at).toLocaleDateString('es-AR') : '',
                    Cliente: client ? `${client.first_name} ${client.last_name}` : 'N/A',
                    Vehiculo: wo.vehicle_id || '',
                    Descripcion: wo.description || '',
                    Estado: wo.status || '',
                    Total: wo.total_price || 0
                };
            });
            filename = `ordenes_trabajo_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (dataType === 'appointments') {
            rows = (data.appointments || []).map(a => ({
                Fecha: a.date || '',
                Hora: a.time || '',
                Motivo: a.title || '',
                Cliente: a.client || '',
                Vehiculo: a.vehicle || '',
                Box: a.box || '',
                Estado: a.status || ''
            }));
            filename = `turnos_${new Date().toISOString().split('T')[0]}.xlsx`;
        } else if (dataType === 'attendance') {
            rows = (timeTrackingLogs || []).map(l => ({
                Fecha: new Date(l.timestamp).toLocaleDateString('es-AR'),
                Hora: new Date(l.timestamp).toLocaleTimeString('es-AR'),
                Empleado: l.employee_name || '',
                Evento: l.type === 'IN' ? 'ENTRADA' : 'SALIDA',
            }));
            filename = `asistencia_${new Date().toISOString().split('T')[0]}.xlsx`;
        }

        if (rows.length === 0) return alert('No hay datos para exportar');

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

        // Set column widths automatically
        const colWidths = Object.keys(rows[0]).map(key => ({
            wch: Math.max(key.length, ...rows.map(row => row[key] ? row[key].toString().length : 0)) + 2
        }));
        worksheet['!cols'] = colWidths;

        // Export to file
        XLSX.writeFile(workbook, filename);
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

    const deleteClient = async (id) => {
        const { error } = await supabase
            .from('clients').delete().eq('id', id);
        if (error) { console.error("Error deleting client", error); throw error; }
        setData(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== id) }));
        return true;
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


        setData(prev => ({ ...prev, inventory: [...prev.inventory, newItem] }));
        return newItem;
    };

    const updateInventoryItem = async (id, updates) => {
        const { data, error } = await supabase.from('inventory').update(updates).eq('id', id).select();
        if (error) { console.error("Error updating inventory item", error); throw error; }

        if (!data || data.length === 0) {
            console.error("No item returned after update.");
            return updates; // Return the updates as fallback
        }

        const updated = data[0];


        setData(prev => ({ ...prev, inventory: prev.inventory.map(i => i.id === id ? { ...i, ...updated } : i) }));
        return updated;
    };

    const deleteInventoryItem = async (id) => {
        const item = data.inventory.find(i => i.id === id);
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) { console.error("Error deleting inventory item", error); throw error; }


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
            // 1. Asignar mecánicos si existen
            if (woData.mechanic_ids && woData.mechanic_ids.length > 0) {
                const assignments = woData.mechanic_ids.map(mid => ({
                    work_order_id: newWo.id,
                    mechanic_id: mid,
                    labor_commission_percent: woData.applied_commission_rate
                }));
                await supabase.from('work_order_assignments').insert(assignments);
            }

            // 2. Asignar productos si existen
            if (woData.products && woData.products.length > 0) {
                const items = woData.products.map(p => ({
                    work_order_id: newWo.id,
                    inventory_item_id: p.id,
                    description: p.name,
                    quantity: p.qty,
                    unit_price: p.sell_price,
                    total_price: p.sell_price * p.qty,
                    is_labor: false
                }));
                await supabase.from('work_order_items').insert(items);

                // Descontar stock
                for (const p of woData.products) {
                    if (p.stock_type === 'UNIT') {
                        await supabase.from('inventory').update({
                            stock_quantity: Math.max(0, (p.stock_quantity || 0) - p.qty)
                        }).eq('id', p.id);
                    } else if (p.stock_type === 'VOLUME') {
                        const mlToDeduct = Math.round(p.qty * 1000);
                        await supabase.from('inventory').update({
                            stock_ml: Math.max(0, (p.stock_ml || 0) - mlToDeduct)
                        }).eq('id', p.id);
                    }
                }
            }


            await loadData();
            return newWo;
        }
        if (error) { console.error("Error creating WO", error); throw error; }
    };
    
    const addItemsToWorkOrder = async (woId, products) => {
        if (!products || products.length === 0) return;
        
        try {
            const items = products.map(p => ({
                work_order_id: woId,
                inventory_item_id: p.id,
                description: p.name,
                quantity: p.qty,
                unit_price: p.sell_price,
                total_price: p.sell_price * p.qty,
                is_labor: false
            }));
            
            const { error: itemsError } = await supabase.from('work_order_items').insert(items);
            if (itemsError) throw itemsError;

            // Descontar stock
            for (const p of products) {
                if (p.stock_type === 'UNIT') {
                    await supabase.from('inventory').update({
                        stock_quantity: Math.max(0, (p.stock_quantity || 0) - p.qty)
                    }).eq('id', p.id);
                } else if (p.stock_type === 'VOLUME') {
                    const mlToDeduct = Math.round(p.qty * 1000);
                    await supabase.from('inventory').update({
                        stock_ml: Math.max(0, (p.stock_ml || 0) - mlToDeduct)
                    }).eq('id', p.id);
                }
            }

            // Actualizar precio total de la OT
            const wo = data.workOrders.find(w => w.id === woId);
            if (wo) {
                const addedCost = products.reduce((sum, p) => sum + (p.sell_price * p.qty), 0);
                const newPartsCost = (wo.parts_cost || 0) + addedCost;
                const newTotal = (wo.total_price || 0) + addedCost;
                
                await supabase.from('work_orders').update({
                    parts_cost: newPartsCost,
                    total_price: newTotal
                }).eq('id', woId);
            }

            await loadData();
            return true;
        } catch (error) {
            console.error("Error adding items to WO", error);
            throw error;
        }
    };

    const updateWorkOrder = async (id, updates, paymentInfo = null, afipData = null, mechanicIds = null) => {
        const { error } = await supabase.from('work_orders').update(updates).eq('id', id);
        if (!error) {
            // Update assignments if mechanicIds provided
            if (mechanicIds) {
                try {
                    // 1. Delete old assignments
                    await supabase.from('work_order_assignments').delete().eq('work_order_id', id);
                    // 2. Insert new ones
                    const assignments = mechanicIds.map(mid => ({
                        work_order_id: id,
                        mechanic_id: mid,
                        labor_commission_percent: updates.applied_commission_rate || 0
                    }));
                    if (assignments.length > 0) {
                        await supabase.from('work_order_assignments').insert(assignments);
                    }
                } catch (e) {
                    console.error('Error updating WO assignments', e);
                }
            }

            // Si la orden se finaliza o cobra, intentar crear el pago automáticamente en caja
            if (updates.status === 'Finalizado' || updates.status === 'Cobrado') {
                const wo = data.workOrders?.find(w => w.id === id);
                if (wo && wo.total_price > 0) {
                    try {
                        const existPayment = data.payments?.some(p => p.work_order_id === id);
                        if (!existPayment) {
                            const method = paymentInfo?.method || 'EFECTIVO';
                            const combined = paymentInfo?.combinedAmounts;
                            const mainMechanicId = (mechanicIds && mechanicIds.length > 0) ? mechanicIds[0] : (wo.mechanic_id || null);

                            if (method === 'COMBINADO' && combined) {
                                for (const [m, amount] of Object.entries(combined)) {
                                    const amt = parseFloat(amount);
                                    if (amt > 0) {
                                        await addPayment({
                                            amount: amt,
                                            method: m,
                                            description: `Pago OT #${wo.order_number} (${m})`,
                                            type: 'INGRESO',
                                            reference: 'OT',
                                            work_order_id: wo.id,
                                            employee_id: mainMechanicId,
                                            cae: afipData ? afipData.cae : null,
                                            cae_due_date: afipData ? afipData.caeDueDate : null,
                                            receipt_number: afipData ? afipData.receiptText : null
                                        });
                                    }
                                }
                            } else {
                                await addPayment({
                                    amount: wo.total_price,
                                    method: method,
                                    description: `Pago OT #${wo.order_number}`,
                                    type: 'INGRESO',
                                    reference: 'OT',
                                    work_order_id: wo.id,
                                    employee_id: mainMechanicId,
                                    cae: afipData ? afipData.cae : null,
                                    cae_due_date: afipData ? afipData.caeDueDate : null,
                                    receipt_number: afipData ? afipData.receiptText : null
                                });
                            }
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

    const deleteWorkOrder = async (id) => {
        try {
            console.log("Iniciando borrado de OT:", id);
            
            const { error: err1 } = await supabase.from('payments').delete().eq('work_order_id', id);
            if (err1) throw new Error("Pagos: " + err1.message);

            const { error: err2 } = await supabase.from('work_order_assignments').delete().eq('work_order_id', id);
            if (err2) throw new Error("Asignaciones: " + err2.message);

            const { error: err3 } = await supabase.from('work_order_items').delete().eq('work_order_id', id);
            if (err3) throw new Error("Items: " + err3.message);

            const { data, error: err4 } = await supabase.from('work_orders').delete().eq('id', id).select();
            if (err4) throw new Error("OT: " + err4.message);
            
            if (!data || data.length === 0) {
                 throw new Error("No se pudo borrar. Es posible que no tengas permisos (RLS) o el ID (" + id + ") no exista.");
            }

            setData(prev => ({
                ...prev,
                workOrders: prev.workOrders.filter(wo => wo.id !== id),
                assignments: (prev.assignments || []).filter(a => a.work_order_id !== id),
                payments: (prev.payments || []).filter(p => p.work_order_id !== id)
            }));
            
            alert('OT eliminada exitosamente.');
            return true;
        } catch (e) {
            console.error("Error deleting work order", e);
            alert("No se pudo eliminar la OT: " + e.message);
            throw e;
        }
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

        setData(prev => ({ ...prev, payments: [newWithdrawal, ...prev.payments] }));
        return newWithdrawal;
    };

    const updatePayment = async (id, updates) => {
        const { data: updated, error } = await supabase
            .from('payments')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) { console.error("Error updating payment", error); throw error; }

        const paymentReturned = updated && updated.length > 0 ? updated[0] : updates;

        setData(prev => ({
            ...prev,
            payments: prev.payments.map(p => p.id === id ? { ...p, ...paymentReturned } : p)
        }));

        return paymentReturned;
    };

    const deletePayment = async (id) => {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) { console.error("Error deleting payment", error); throw error; }

        setData(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== id) }));
    };

    const performCashClose = async (closeData) => {
        const today = new Date().toISOString().split('T')[0];

        // Find previous closing balance
        const sortedClosings = (data.cashClosings || []).sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
        const lastClosing = sortedClosings.length > 0 ? sortedClosings[0] : null;
        const startingBalance = lastClosing ? (lastClosing.actual_cash || 0) : 0;

        const { data: closingResult, error } = await supabase
            .from('cash_closings')
            .insert([{
                date: today,
                starting_balance: startingBalance,
                cash_income: closeData.cash_expected || 0,
                transfer_income: closeData.transfer_total || 0,
                card_income: closeData.card_total || 0,
                expected_cash: (closeData.cash_expected || 0) + startingBalance,
                actual_cash: closeData.cash_real || 0,
                difference: closeData.difference || 0,
                employee_id: closeData.employee_id || null
            }])
            .select();

        if (error) { console.error("Error performing cash close", error); throw error; }

        const closing = closingResult && closingResult.length > 0 ? closingResult[0] : null;

        // Mark all unclosed payments with this closing ID
        const unclosedPayments = data.payments.filter(p => !p.cash_closing_id).map(p => p.id);

        if (unclosedPayments.length > 0 && closing?.id) {
            await supabase
                .from('payments')
                .update({ cash_closing_id: closing.id })
                .in('id', unclosedPayments);
        }


        // Reload all data so the view refreshes with the marked payments
        await loadData();
        return closing;
    };

    // ==========================================
    // Punto de Venta — processSale
    // ==========================================
    const processSale = async (cart, payMethod, afipData = null, employeeId = null, cashierProfit = 0) => {
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
                reference: null,
                employee_id: employeeId || null,
                cashier_profit_amount: cashierProfit,
                cae: afipData?.cae || null,
                cae_due_date: afipData?.cae_due_date || null,
                receipt_number: afipData?.receipt_number || null
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
            } else if (ci.stock_type === 'VOLUME') {
                // Para VOLUME, ci.qty representa Litros. Descontamos en ml.
                const mlToDeduct = Math.round(ci.qty * 1000);
                await supabase.from('inventory').update({
                    stock_ml: Math.max(0, (ci.stock_ml || 0) - mlToDeduct)
                }).eq('id', ci.id);
            }
        }

        // 3. Refresh data
        await loadData();
        return total;
    };

    const updateAssignmentCommission = async (assignmentId, updates) => {
        const { error } = await supabase
            .from('work_order_assignments')
            .update(updates)
            .eq('id', assignmentId);

        if (error) { console.error("Error updating commission", error); throw error; }
        await loadData();
    };

    // ==========================================
    // Comisiones
    // ==========================================
    const getCommissions = (employeeId) => {
        // 1. Comisiones por Órdenes de Trabajo (OT)
        const assignments = (data.assignments || []).filter(a => a.mechanic_id === employeeId);
        const otCommissions = assignments.reduce((sum, a) => {
            const wo = data.workOrders?.find(w => w.id === a.work_order_id);
            if (wo && (wo.status === 'Finalizado' || wo.status === 'Cobrado')) {
                const labor = parseFloat(wo.labor_cost) || 0;
                const emp = (data.employees || []).find(e => e.id === employeeId);
                const rate = wo.applied_commission_rate ? parseFloat(wo.applied_commission_rate) : (emp ? parseFloat(emp.commission_rate) : 0);
                return sum + (labor * (rate / 100));
            }
            return sum;
        }, 0);

        // 2. Comisiones por Servicios Rápidos (Gomería)
        const quickCommissions = (data.employeeEarnings || [])
            .filter(e => e.employee_id === employeeId && e.quick_service_id)
            .reduce((sum, e) => sum + (parseFloat(e.amount_earned) || 0), 0);

        // 3. Comisiones de Cajero (Ventas POS)
        const cashierCommissions = (data.payments || [])
            .filter(p => p.employee_id === employeeId && p.type === 'VENTA')
            .reduce((sum, p) => sum + (parseFloat(p.cashier_profit_amount) || 0), 0);

        return otCommissions + quickCommissions + cashierCommissions;
    };

    const getDetailedEmployeeStats = (employeeId) => {
        const logs = (timeTrackingLogs || []).filter(l => l.employee_id === employeeId);
        
        // Calcular horas trabajadas
        let totalMs = 0;
        const processedLogs = [...logs].reverse(); // De más viejo a más nuevo
        let lastIn = null;
        
        processedLogs.forEach(log => {
            if (log.type === 'IN') {
                lastIn = new Date(log.timestamp);
            } else if (log.type === 'OUT' && lastIn) {
                totalMs += (new Date(log.timestamp) - lastIn);
                lastIn = null;
            }
        });
        
        const totalHours = totalMs / (1000 * 60 * 60);

        // Producción en OTs
        const assignments = (data.assignments || []).filter(a => a.mechanic_id === employeeId);
        const otProduction = assignments.map(a => {
            const wo = data.workOrders?.find(w => w.id === a.work_order_id);
            return {
                id: a.id,
                date: wo?.completed_at || wo?.created_at,
                type: 'OT',
                description: wo?.description || 'Órden de Trabajo',
                order_number: wo?.order_number,
                amount: parseFloat(wo?.labor_cost) || 0,
                status: wo?.status
            };
        }).filter(item => item.status === 'Finalizado' || item.status === 'Cobrado');

        // Producción en Gomería
        const quickProduction = (data.dailyQuickServices || [])
            .filter(s => s.mechanic_id === employeeId)
            .map(s => ({
                id: s.id,
                date: s.created_at,
                type: 'GOMERÍA',
                description: s.service_type || 'Servicio Rápido',
                amount: parseFloat(s.price) || 0,
                status: 'Finalizado'
            }));

        // Producción de Cajeros (Ventas POS)
        const posProduction = (data.payments || [])
            .filter(p => p.employee_id === employeeId && p.type === 'VENTA')
            .map(p => ({
                id: p.id,
                date: p.date || p.created_at,
                type: 'PUNTO DE VENTA',
                description: p.description || 'Venta de Mostrador',
                amount: parseFloat(p.amount) || 0,
                status: 'Finalizado'
            }));

        const combinedProduction = [...otProduction, ...quickProduction, ...posProduction].sort((a, b) => new Date(b.date) - new Date(a.date));
        const totalProductionAmount = combinedProduction.reduce((sum, item) => sum + item.amount, 0);

        return {
            totalHours: totalHours.toFixed(1),
            attendanceLogs: logs,
            productionList: combinedProduction,
            totalProductionAmount,
            productionCount: combinedProduction.length
        };
    };

    const getEmployeeProductivity = (employeeId) => {
        const stats = getDetailedEmployeeStats(employeeId);
        return {
            count: stats.productionCount,
            total_labor: stats.totalProductionAmount,
            commission: getCommissions(employeeId)
        };
    };

    return (
        <AppContext.Provider value={{
            data,
            timeTrackingLogs,
            loading,
            refreshData: loadData,
            addTimeLog,
            getClient,
            getVehicle,
            getClientVehicles,
            getLowStockItems,
            getVehicleHistory,
            addClient,
            updateClient,
            deleteClient,
            addVehicle,
            updateVehicle,
            addVehicleNote,
            addInventoryItem,
            updateInventoryItem,
            deleteInventoryItem,
            addSupplier,
            updateSupplier,
            addWorkOrder,
            addItemsToWorkOrder,
            updateWorkOrder,
            addPayment,
            updatePayment,
            deletePayment,
            addWithdrawal,
            performCashClose,
            processSale,
            updateAssignmentCommission,
            getCommissions,
            getEmployeeProductivity,
            getDetailedEmployeeStats,
            addQuickService,
            getActiveEmployees,
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
