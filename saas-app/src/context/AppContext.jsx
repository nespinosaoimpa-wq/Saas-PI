import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK } from '../data/data';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // Inicializar estado desde localStorage o MOCK
    const [data, setData] = useState(() => {
        const defaultData = { ...MOCK, activityLog: [], closings: [] };
        try {
            const localData = localStorage.getItem('piripi-saas-data');
            if (localData) {
                const parsed = JSON.parse(localData);
                return { ...defaultData, ...parsed };
            }
        } catch (error) {
            console.error('Error loading data from localStorage', error);
        }
        return defaultData;
    });

    // Guardar en localStorage cada vez que cambie 'data'
    useEffect(() => {
        localStorage.setItem('piripi-saas-data', JSON.stringify(data));
    }, [data]);

    // ==========================================
    // Helpers (antes en data.js, ahora reactivos)
    // ==========================================
    const getClient = (id) => data.clients.find(c => c.id === id);
    const getVehicle = (id) => data.vehicles.find(v => v.id === id);
    const getClientVehicles = (clientId) => data.vehicles.filter(v => v.client_id === clientId);
    const getLowStockItems = () => data.inventory.filter(i =>
        (i.stock_type === 'UNIT' && i.stock_quantity <= i.stock_min) ||
        (i.stock_type === 'VOLUME' && i.stock_ml <= i.stock_min_ml)
    );

    // ==========================================
    // Acciones CRUD
    // ==========================================

    // Clientes
    const addClient = (clientData) => {
        const newClient = { ...clientData, id: 'c' + Date.now(), vehicles: [] };
        setData(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
        return newClient;
    };

    const updateClient = (id, updates) => {
        setData(prev => ({
            ...prev,
            clients: prev.clients.map(c => c.id === id ? { ...c, ...updates } : c)
        }));
    };

    // Vehículos
    const addVehicle = (vehicleData) => {
        const newVehicle = { ...vehicleData, id: 'v' + Date.now(), history: [], health_score: 100 };
        setData(prev => {
            const updatedClients = prev.clients.map(c =>
                c.id === vehicleData.client_id ? { ...c, vehicles: [...c.vehicles, newVehicle.id] } : c
            );
            return {
                ...prev,
                vehicles: [...prev.vehicles, newVehicle],
                clients: updatedClients
            };
        });
        return newVehicle;
    };

    // Órdenes de Trabajo
    const addWorkOrder = (woData) => {
        const newWo = {
            ...woData,
            id: 'wo' + Date.now(),
            order_number: Math.floor(1000 + Math.random() * 9000),
            created_at: new Date().toISOString()
        };
        setData(prev => ({ ...prev, workOrders: [...prev.workOrders, newWo] }));
        return newWo;
    };

    const updateWorkOrder = (id, updates) => {
        setData(prev => ({
            ...prev,
            workOrders: prev.workOrders.map(wo => wo.id === id ? { ...wo, ...updates } : wo)
        }));
    };

    // Pagos / Caja
    const addPayment = (paymentData) => {
        const newPayment = {
            ...paymentData,
            id: 'p' + Date.now(),
            date: new Date().toISOString().split('T')[0]
        };
        setData(prev => ({ ...prev, payments: [...prev.payments, newPayment] }));
        return newPayment;
    };

    // Inventario
    const updateInventoryStock = (id, quantity, isVolume = false) => {
        setData(prev => ({
            ...prev,
            inventory: prev.inventory.map(item => {
                if (item.id === id) {
                    if (isVolume) {
                        return { ...item, stock_ml: item.stock_ml + quantity };
                    } else {
                        return { ...item, stock_quantity: item.stock_quantity + quantity };
                    }
                }
                return item;
            })
        }));
    };

    const addInventoryItem = (itemData) => {
        const newItem = { ...itemData, id: itemData.id || 'inv' + Date.now() };
        setData(prev => ({ ...prev, inventory: [...prev.inventory, newItem] }));
        return newItem;
    };

    // Proveedores
    const addSupplier = (supplierData) => {
        const newSupplier = { ...supplierData, id: 's' + Date.now() };
        setData(prev => ({ ...prev, suppliers: [...prev.suppliers, newSupplier] }));
        return newSupplier;
    };

    const updateSupplier = (id, updates) => {
        setData(prev => ({
            ...prev,
            suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
    };

    // Gomería / Servicios Rápidos
    const addQuickService = (service) => {
        const newPayment = {
            id: 'p' + Date.now(),
            amount: service.price,
            method: 'EFECTIVO',
            date: new Date().toISOString().split('T')[0],
            description: `Servicio Rápido: ${service.label}`,
            reference: 'GOMERIA'
        };

        const logEntry = {
            id: 'log' + Date.now(),
            type: 'QUICK_SERVICE',
            label: service.label,
            price: service.price,
            timestamp: new Date().toISOString()
        };

        setData(prev => ({
            ...prev,
            payments: [...prev.payments, newPayment],
            activityLog: [logEntry, ...(prev.activityLog || [])].slice(0, 10)
        }));
    };

    // Comisiones (Calculado)
    const getCommissions = (technicianName) => {
        // Implementación básica: 15% de las OTs finalizadas por él
        const finished = data.workOrders.filter(wo => wo.mechanic === technicianName && wo.status === 'Finalizado' || wo.status === 'Cobrado');
        return finished.reduce((sum, wo) => sum + (wo.total_price * 0.15), 0);
    };

    // Egresos / Retiros
    const addWithdrawal = (withdrawalData) => {
        const newPayment = {
            id: 'p' + Date.now(),
            amount: -Math.abs(withdrawalData.amount),
            method: 'EFECTIVO',
            date: new Date().toISOString().split('T')[0],
            description: `Retiro: ${withdrawalData.description}`,
            reference: 'EGRESO'
        };

        const logEntry = {
            id: 'log' + Date.now(),
            type: 'WITHDRAWAL',
            label: withdrawalData.description,
            price: -Math.abs(withdrawalData.amount),
            timestamp: new Date().toISOString()
        };

        setData(prev => ({
            ...prev,
            payments: [...prev.payments, newPayment],
            activityLog: [logEntry, ...(prev.activityLog || [])].slice(0, 10)
        }));
    };

    // Cierre de Caja
    const performCashClose = (closingData) => {
        const newClosing = {
            ...closingData,
            id: 'close' + Date.now(),
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        };
        setData(prev => ({ ...prev, closings: [...(prev.closings || []), newClosing] }));
        return newClosing;
    };

    // Agregaré más acciones CRUD a medida que se necesiten en cada página...

    return (
        <AppContext.Provider value={{
            data,
            setData,
            getClient,
            getVehicle,
            getClientVehicles,
            getLowStockItems,
            addClient,
            updateClient,
            addVehicle,
            addWorkOrder,
            updateWorkOrder,
            addPayment,
            updateInventoryStock,
            addSupplier,
            updateSupplier,
            addQuickService,
            getCommissions,
            addWithdrawal,
            addInventoryItem,
            performCashClose
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
