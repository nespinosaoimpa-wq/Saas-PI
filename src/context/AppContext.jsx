import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MOCK } from '../data/data';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [data, setData] = useState({
        clients: [], vehicles: [], workOrders: [],
        inventory: [], suppliers: [], boxes: [],
        payments: [], closings: [], activityLog: [],
        // Mock fallbacks for features not yet in Supabase
        revenue: MOCK.revenue,
        appointments: MOCK.appointments || [],
        promotions: MOCK.promotions || [],
        currentUser: MOCK.currentUser,
        checklist_template: MOCK.checklist_template || [],
    });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!supabase) return;
        setLoading(true);
        try {
            const [
                { data: clients }, { data: vehicles }, { data: workOrders },
                { data: inventory }, { data: suppliers }, { data: boxes }
            ] = await Promise.all([
                supabase.from('clients').select('*'),
                supabase.from('vehicles').select('*'),
                supabase.from('work_orders').select('*').order('created_at', { ascending: false }),
                supabase.from('inventory').select('*'),
                supabase.from('suppliers').select('*'),
                supabase.from('boxes').select('*')
            ]);

            setData(prev => ({
                ...prev,
                clients: clients || [],
                vehicles: vehicles || [],
                workOrders: workOrders || [],
                inventory: inventory || [],
                suppliers: suppliers || [],
                boxes: boxes || [],
            }));
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Helpers
    const getClient = (id) => data.clients.find(c => c.id === id);
    const getVehicle = (id) => data.vehicles.find(v => v.id === id);
    const getClientVehicles = (clientId) => data.vehicles.filter(v => v.client_id === clientId);
    const getLowStockItems = () => data.inventory.filter(i =>
        (i.stock_type === 'UNIT' && i.stock_quantity <= i.stock_min) ||
        (i.stock_type === 'VOLUME' && i.stock_ml <= i.stock_min_ml)
    );

    // Órdenes de Trabajo (Sincronizado)
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
        }]).select().single();
        if (!error && newWo) {
            setData(prev => ({ ...prev, workOrders: [newWo, ...prev.workOrders] }));
            return newWo;
        }
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

    // Commissions
    const getCommissions = (technicianId) => {
        const finished = data.workOrders.filter(wo => wo.mechanic_id === technicianId && (wo.status === 'Finalizado' || wo.status === 'Cobrado'));
        return finished.reduce((sum, wo) => sum + ((wo.labor_cost || 0) * ((wo.applied_commission_rate || 0) / 100)), 0);
    };

    // Quick Service (Gomería)
    const addQuickService = (action) => {
        const entry = {
            id: `qs-${Date.now()}`,
            label: action.label,
            price: action.price,
            timestamp: new Date().toISOString()
        };
        setData(prev => ({
            ...prev,
            activityLog: [entry, ...(prev.activityLog || [])]
        }));
        if (action.price > 0) {
            alert(`✅ ${action.label} registrado — ${action.price > 0 ? '$' + action.price.toLocaleString('es-AR') : 'GRATIS'}`);
        } else {
            alert(`✅ ${action.label} registrado — GRATIS`);
        }
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
            addWorkOrder,
            updateWorkOrder,
            getCommissions,
            addQuickService,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
