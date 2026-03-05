import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK } from '../data/data';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [data, setData] = useState({
        clients: [], vehicles: [], workOrders: [],
        inventory: [], suppliers: [], boxes: [],
        payments: [], cashClosings: [], vehicleNotes: [],
        appointments: [], promotions: [],
        activityLog: []
    });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [
                { data: clients }, { data: vehicles }, { data: workOrders },
                { data: inventory }, { data: suppliers }, { data: boxes },
                { data: vehicleNotes }, { data: payments }, { data: cashClosings },
                { data: appointments }, { data: promotions }
            ] = await Promise.all([
                supabase.from('clients').select('*'),
                supabase.from('vehicles').select('*'),
                supabase.from('work_orders').select('*, clients(*), vehicles(*)').order('created_at', { ascending: false }),
                supabase.from('inventory').select('*'),
                supabase.from('suppliers').select('*'),
                supabase.from('boxes').select('*'),
                supabase.from('vehicle_notes').select('*').order('created_at', { ascending: false }),
                supabase.from('payments').select('*').order('created_at', { ascending: false }),
                supabase.from('cash_closings').select('*').order('created_at', { ascending: false }),
                supabase.from('appointments').select('*').order('date', { ascending: true }),
                supabase.from('promotions').select('*').order('created_at', { ascending: false })
            ]);

            setData({
                clients: clients || [],
                vehicles: vehicles || [],
                workOrders: workOrders || [],
                inventory: inventory || [],
                suppliers: suppliers || [],
                boxes: boxes || [],
                vehicleNotes: vehicleNotes || [],
                payments: payments || [],
                cashClosings: cashClosings || [],
                appointments: appointments || [],
                promotions: promotions || [],
                activityLog: []
            });
        } catch (e) {
            console.error('Error loading data:', e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
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

    const addQuickService = async (action, isSecondOrMore = false) => {
        const finalPrice = isSecondOrMore ? action.price * 0.7 : action.price; // 30% discount if second
        const entry = {
            id: `qs-${Date.now()}`,
            label: isSecondOrMore ? `${action.label} (Adicional -30%)` : action.label,
            price: finalPrice,
            timestamp: new Date().toISOString()
        };

        // Enlazar con la caja automáticamente si tiene un precio mayor a 0
        if (finalPrice > 0) {
            try {
                await addPayment({
                    amount: finalPrice,
                    method: 'EFECTIVO',
                    description: `Express Gomería: ${entry.label}`,
                    type: 'INGRESO',
                    reference: 'LOCAL'
                });
            } catch (e) {
                console.error("Error registering express payment to cash register", e);
            }
        }

        setData(prev => ({
            ...prev,
            activityLog: [entry, ...(prev.activityLog || [])]
        }));
        alert(`✅ ${entry.label} registrado — $${finalPrice.toLocaleString('es-AR')}`);
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

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
                cuit: supplierData.cuit || ''
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
                cuit: updates.cuit || ''
            })
            .eq('id', id)
            .select()
            .single();

        if (error) { console.error("Error updating supplier", error); throw error; }
        setData(prev => ({ ...prev, suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...updated } : s) }));
        return updated;
    };

    // ==========================================
    // Órdenes de Trabajo
    // ==========================================
    const addWorkOrder = async (woData) => {
        const { data: newWo, error } = await supabase.from('work_orders').insert([{
            client_id: woData.client_id,
            vehicle_id: woData.vehicle_id,
            box_id: woData.box_id || null,
            mechanic_id: woData.mechanic_id || null,
            description: woData.description,
            km_at_entry: woData.km_at_entry || 0,
            labor_cost: woData.labor_cost,
            parts_cost: woData.parts_cost,
            total_price: woData.total_price,
            applied_commission_rate: woData.applied_commission_rate,
            status: woData.box_id ? 'En Box' : 'Pendiente'
        }]).select('*, clients(*), vehicles(*)').single();
        if (!error && newWo) {
            setData(prev => ({ ...prev, workOrders: [newWo, ...prev.workOrders] }));
            return newWo;
        }
        if (error) { console.error("Error creating WO", error); throw error; }
    };

    const updateWorkOrder = async (id, updates) => {
        const { error } = await supabase.from('work_orders').update(updates).eq('id', id);
        if (!error) {
            setData(prev => ({
                ...prev,
                workOrders: prev.workOrders.map(wo => wo.id === id ? { ...wo, ...updates } : wo)
            }));
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
                employee_id: paymentData.employee_id || null
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
        const finished = (data.workOrders || []).filter(wo => wo && wo.mechanic_id === technicianId && (wo.status === 'Finalizado' || wo.status === 'Cobrado'));
        return finished.reduce((sum, wo) => sum + ((parseFloat(wo.labor_cost) || 0) * ((parseFloat(wo.applied_commission_rate) || 0) / 100)), 0);
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
            addSupplier,
            updateSupplier,
            addWorkOrder,
            updateWorkOrder,
            addPayment,
            addWithdrawal,
            performCashClose,
            processSale,
            getCommissions,
            addQuickService,
            exportToExcel
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
