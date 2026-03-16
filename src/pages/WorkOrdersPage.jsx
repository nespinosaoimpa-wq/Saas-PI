import React, { useState, Fragment, useMemo } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
    Tabs,
    QueueCard,
    EmptyState,
    Modal,
    FormRow,
    FormField,
    SectionHeader,
    CheckItem,
    Icon,
    PrintableTicket,
    SearchBar
} from '../components/ui';

export const WorkOrdersPage = () => {
    const { data: MOCK, getClientVehicles, addWorkOrder, exportToExcel, updateWorkOrder, addItemsToWorkOrder } = useApp();
    const { user, employees } = useAuth();
    const mechanics = employees.filter(e => e.role === 'mecanico' || e.role === 'gomero');

    const [tab, setTab] = useState('active');
    const [showNew, setShowNew] = useState(false);
    const [printWO, setPrintWO] = useState(null);
    const [vehicleSheet, setVehicleSheet] = useState(null);

    const [finalizeWO, setFinalizeWO] = useState(null); // woId to finalize
    const [invoiceType, setInvoiceType] = useState('INTERNAL');
    const [customerCuit, setCustomerCuit] = useState('');
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [addingProductsToWO, setAddingProductsToWO] = useState(null); // WO object or null
    const [extraProducts, setExtraProducts] = useState([]);
    const [extraProductSearch, setExtraProductSearch] = useState('');
    const [isAddingProducts, setIsAddingProducts] = useState(false);
    
    // New states for price editing
    const [editLabor, setEditLabor] = useState('');
    const [editParts, setEditParts] = useState('');
    const [editingWO, setEditingWO] = useState(null); // woId for editing during process

    const handleFinalizeClick = (e, woId) => {
        e.stopPropagation();
        const wo = MOCK.workOrders.find(w => w.id === woId);
        setFinalizeWO(woId);
        setInvoiceType('INTERNAL');
        setEditLabor(wo?.labor_cost || 0);
        setEditParts(wo?.parts_cost || 0);
        // Pre-fill CUIT if cliente has one (dni of 11 digits)
        if (wo?.clients?.dni && wo.clients.dni.length === 11) {
            setCustomerCuit(wo.clients.dni);
        } else {
            setCustomerCuit('');
        }
    };

    const confirmFinalize = async () => {
        if (!finalizeWO) return;
        setIsFinalizing(true);
        try {
            const wo = MOCK.workOrders.find(w => w.id === finalizeWO);
            if (!wo) throw new Error("OT no encontrada");

            let afipData = null;
            if (invoiceType === 'FACTURA_A' || invoiceType === 'FACTURA_B') {
                if (invoiceType === 'FACTURA_A' && (!customerCuit || customerCuit.length < 11)) {
                    throw new Error('Debe ingresar un CUIT válido para Factura A');
                }

                afipData = await MOCK.generateAFIPInvoice({
                    amount: wo.total_price || 0,
                    docType: invoiceType === 'FACTURA_A' ? 80 : 99,
                    docNumber: invoiceType === 'FACTURA_A' ? customerCuit : 0,
                    billType: invoiceType === 'FACTURA_A' ? 1 : 6
                });
            }

            const finalLabor = parseFloat(editLabor) || 0;
            const finalParts = parseFloat(editParts) || 0;
            const finalTotal = finalLabor + finalParts;

            await updateWorkOrder(finalizeWO, {
                status: 'Finalizado',
                completed_at: new Date().toISOString(),
                labor_cost: finalLabor,
                parts_cost: finalParts,
                total_price: finalTotal
            }, afipData); // Pass afipData to track CAE in payment

            setFinalizeWO(null);
            setPrintWO(wo); // Optionally print right after finalizing
        } catch (error) {
            alert('Error al finalizar la OT: ' + error.message);
        } finally {
            setIsFinalizing(false);
        }
    };

    const [newOrder, setNewOrder] = useState({
        client_id: '', vehicle_id: '', box_id: '', km_at_entry: '',
        description: '', labor_cost: '', parts_cost: '',
        mechanic_ids: [], // Array de IDs
        applied_commission_rate: '',
        labor_profit_percent: 100
    });

    // Nuevo estado para la búsqueda interactiva
    const [clientSearch, setClientSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);

    const laborCost = parseFloat(newOrder.labor_cost) || 0;
    const partsManualCost = parseFloat(newOrder.parts_cost) || 0;
    const productsCost = selectedProducts.reduce((sum, p) => sum + (p.sell_price * p.qty), 0);
    const totalPrice = laborCost + partsManualCost + productsCost;

    const selectedMechanics = mechanics.filter(m => newOrder.mechanic_ids.includes(m.id));

    const handleCreateWorkOrder = async () => {
        if (!newOrder.client_id || !newOrder.vehicle_id || !newOrder.description) {
            alert('Por favor completá Cliente, Vehículo y Descripción.');
            return;
        }

        const createdWO = await addWorkOrder({
            ...newOrder,
            labor_cost: laborCost,
            parts_cost: partsManualCost + productsCost,
            total_price: totalPrice,
            products: selectedProducts,
            applied_commission_rate: parseFloat(newOrder.applied_commission_rate) || (selectedMechanics.length > 0 ? selectedMechanics[0].commission_rate : 0)
        });

        alert('✅ Orden de Trabajo creada con éxito.');
        setShowNew(false);
        setNewOrder({ client_id: '', vehicle_id: '', box_id: '', km_at_entry: '', description: '', labor_cost: '', parts_cost: '', mechanic_ids: [], applied_commission_rate: '', labor_profit_percent: 100 });
        setClientSearch('');
        setSelectedProducts([]);
        setProductSearch('');
        // Opcional: imprimir el ticket de ingreso inmediatamente
        if (createdWO) {
            setPrintWO(createdWO);
        }
    };

    const filtered = MOCK.workOrders.filter(wo => {
        if (tab === 'active') return wo.status === 'Pendiente' || wo.status === 'En Box';
        if (tab === 'done') return wo.status === 'Finalizado';
        return true;
    });

    // Filtro inteligente de Clientes/Vehículos
    const filteredClients = useMemo(() => {
        if (!clientSearch) return [];
        const term = clientSearch.toLowerCase();
        return MOCK.clients.filter(client => {
            const clientVehicles = getClientVehicles(client.id);
            const matchesClient = `${client.first_name} ${client.last_name} ${client.dni}`.toLowerCase().includes(term);
            const matchesVehicle = clientVehicles.some(v => v.license_plate.toLowerCase().includes(term));
            return matchesClient || matchesVehicle;
        }).slice(0, 5); // Limitar resultados para no colapsar la UI
    }, [clientSearch, MOCK.clients, MOCK.vehicles]);

    const filteredProducts = useMemo(() => {
        if (!productSearch) return [];
        const term = productSearch.toLowerCase();
        return MOCK.inventory.filter(i => 
            i.name.toLowerCase().includes(term) || 
            (i.barcode && i.barcode.toLowerCase().includes(term)) ||
            (i.brand && i.brand.toLowerCase().includes(term))
        ).slice(0, 5);
    }, [productSearch, MOCK.inventory]);

    const addProductToWO = (p) => {
        setSelectedProducts(prev => {
            const existing = prev.find(item => item.id === p.id);
            if (existing) {
                return prev.map(item => item.id === p.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...p, qty: 1 }];
        });
        setProductSearch('');
    };

    const updateProductQty = (id, delta) => {
        setSelectedProducts(prev => prev.map(p => {
            if (p.id === id) {
                const newQty = Math.max(0.1, p.qty + delta);
                return { ...p, qty: Number(newQty.toFixed(2)) };
            }
            return p;
        }).filter(p => p.qty > 0));
    };

    const removeProductFromWO = (id) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== id));
    };

    const handleAddExtraProducts = async () => {
        if (!addingProductsToWO || extraProducts.length === 0) return;
        setIsAddingProducts(true);
        try {
            await addItemsToWorkOrder(addingProductsToWO.id, extraProducts);
            alert('✅ Productos agregados correctamente a la OT.');
            setAddingProductsToWO(null);
            setExtraProducts([]);
            setExtraProductSearch('');
        } catch (e) {
            alert('Error al agregar productos: ' + e.message);
        } finally {
            setIsAddingProducts(false);
        }
    };

    const filteredExtraProducts = useMemo(() => {
        if (!extraProductSearch) return [];
        const term = extraProductSearch.toLowerCase();
        return MOCK.inventory.filter(i => 
            i.name.toLowerCase().includes(term) || 
            (i.barcode && i.barcode.toLowerCase().includes(term)) ||
            (i.brand && i.brand.toLowerCase().includes(term))
        ).slice(0, 5);
    }, [extraProductSearch, MOCK.inventory]);

    const handleSaveEditPrices = async () => {
        if (!editingWO) return;
        const labor = parseFloat(editLabor) || 0;
        const parts = parseFloat(editParts) || 0;
        try {
            await updateWorkOrder(editingWO, {
                labor_cost: labor,
                parts_cost: parts,
                total_price: labor + parts
            });
            alert('✅ Precios actualizados.');
            setEditingWO(null);
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs tabs={[{ key: 'active', label: 'Activas' }, { key: 'done', label: 'Finalizadas' }, { key: 'all', label: 'Todas' }]} active={tab} onChange={setTab} />
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-ghost" onClick={() => exportToExcel('work_orders')} title="Descargar listado de órdenes en formato Excel">
                        <Icon name="download" size={18} /> Exportar Excel
                    </button>
                    { ['admin', 'cajero'].includes(user.role) && (
                        <button className="btn btn-primary" onClick={() => setShowNew(true)} title="Crear una nueva orden de trabajo para un cliente"><Icon name="add_circle" size={18} /> Nueva OT</button>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map(wo => {
                        // Adaptar el UI de QueueCard a los datos relacionales de Supabase
                        const clientName = wo.clients ? `${wo.clients.first_name} ${wo.clients.last_name}` : 'Cliente Sin Nombre';
                        const vehicleName = wo.vehicles ? `${wo.vehicles.license_plate} - ${wo.vehicles.brand} ${wo.vehicles.model}` : 'Vehículo';

                        const woAssignments = MOCK.assignments?.filter(a => a.work_order_id === wo.id) || [];
                        const mechanicNames = woAssignments.map(a => employees.find(e => e.id === a.mechanic_id)?.name).filter(Boolean).join(', ') || 'Sin Asignar';

                        const boxName = MOCK.boxes.find(b => b.id === wo.box_id)?.name || 'Sin Box';

                        return (
                            <QueueCard
                                key={wo.id}
                                wo={{
                                    ...wo,
                                    client: clientName,
                                    vehicle: vehicleName,
                                    mechanic: mechanicNames,
                                    box: boxName
                                }}
                                onViewVehicle={setVehicleSheet}
                                rightAction={
                                    (wo.status === 'Pendiente' || wo.status === 'En Box') && ['admin', 'cajero'].includes(user.role) ? (
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setEditingWO(wo.id); 
                                                    setEditLabor(wo.labor_cost || 0); 
                                                    setEditParts(wo.parts_cost || 0); 
                                                }}
                                                style={{ height: 32, padding: '0 12px', fontSize: 12, fontWeight: 700 }}
                                                title="Editar detalles o presupuesto de la orden"
                                            >
                                                EDITAR
                                            </button>
                                            <button
                                                className="btn btn-primary btn-sm"
                                                onClick={(e) => { e.stopPropagation(); setAddingProductsToWO(wo); setExtraProducts([]); setExtraProductSearch(''); }}
                                                style={{ height: 32, padding: '0 12px', fontSize: 12, fontWeight: 700, background: 'var(--info)' }}
                                                title="Agregar más productos o insumos a esta orden"
                                            >
                                                + PRODUCTO
                                            </button>
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={(e) => handleFinalizeClick(e, wo.id)}
                                                style={{ height: 32, padding: '0 12px', fontSize: 12, fontWeight: 700 }}
                                                title="Finalizar y registrar cobro de la orden"
                                            >
                                                FINALIZAR
                                            </button>
                                        </div>
                                    ) : null
                                }
                                onClick={() => {
                                    if (wo.status === 'Finalizado' || wo.status === 'Cobrado') {
                                        setPrintWO(wo);
                                    }
                                }}
                            />
                        );
                    })}
                    {filtered.length === 0 && <EmptyState icon="assignment" title="Sin órdenes" sub="No hay órdenes para este filtro" />}
                </div>

                {showNew && (
                    <Modal title="Nueva Orden de Trabajo" onClose={() => setShowNew(false)} width="800px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleCreateWorkOrder}><Icon name="print" size={16} /> Crear OT</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {newOrder.client_id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>{MOCK.clients.find(c => c.id === newOrder.client_id)?.first_name} {MOCK.clients.find(c => c.id === newOrder.client_id)?.last_name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DNI: {MOCK.clients.find(c => c.id === newOrder.client_id)?.dni}</div>
                                        </div>
                                        <button className="btn btn-sm btn-ghost" onClick={() => { setNewOrder({ ...newOrder, client_id: '', vehicle_id: '' }); setClientSearch(''); }}>
                                            Cambiar
                                        </button>
                                    </div>
                                    <FormField label="Seleccionar Vehículo Asociado">
                                        <select className="form-select" value={newOrder.vehicle_id} onChange={e => setNewOrder({ ...newOrder, vehicle_id: e.target.value })}>
                                            <option value="">Seleccionar vehículo...</option>
                                            {getClientVehicles(newOrder.client_id).map(v => <option key={v.id} value={v.id}>{v.license_plate} - {v.brand} {v.model}</option>)}
                                        </select>
                                    </FormField>
                                </div>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <FormField label="Buscar Cliente o Vehículo">
                                        <SearchBar
                                            value={clientSearch}
                                            onChange={setClientSearch}
                                            placeholder="Buscar por DNI, Nombre o Patente..."
                                        />
                                    </FormField>

                                    {clientSearch && filteredClients.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-sm)', marginTop: 4, zIndex: 10,
                                            maxHeight: 200, overflowY: 'auto', boxShadow: 'var(--shadow-md)'
                                        }}>
                                            {filteredClients.map(c => (
                                                <div
                                                    key={c.id}
                                                    style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                                    onClick={() => setNewOrder({ ...newOrder, client_id: c.id, vehicle_id: '' })}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.first_name} {c.last_name}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DNI: {c.dni}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)' }}>
                                                        {getClientVehicles(c.id).map(v => <span key={v.id} style={{ display: 'inline-block', background: 'var(--bg-base)', padding: '2px 4px', borderRadius: 4, marginLeft: 4 }}>{v.license_plate}</span>)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {clientSearch && filteredClients.length === 0 && (
                                        <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', marginTop: 8 }}>
                                            No se encontraron coincidencias.
                                        </div>
                                    )}
                                </div>
                            )}
                            <FormRow>
                                <FormField label="Box asignado">
                                    <select className="form-select" value={newOrder.box_id} onChange={e => setNewOrder({ ...newOrder, box_id: e.target.value })}>
                                        <option value="">Sin asignar</option>
                                        {MOCK.boxes.map(b => <option key={b.id} value={b.id}>{b.name} {b.type ? `(${b.type})` : ''}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Km al ingresar">
                                    <input className="form-input" type="number" placeholder="Ej: 85000" value={newOrder.km_at_entry} onChange={e => setNewOrder({ ...newOrder, km_at_entry: e.target.value })} />
                                </FormField>
                            </FormRow>
                            <FormField label="Descripción del trabajo">
                                <textarea className="form-textarea" placeholder="Describir el trabajo a realizar..." value={newOrder.description} onChange={e => setNewOrder({ ...newOrder, description: e.target.value })} />
                            </FormField>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                            <SectionHeader icon="inventory_2" title="Repuestos y Productos (Stock)" />
                            <div style={{ position: 'relative' }}>
                                <FormField label="Buscar Repuesto o Insumo">
                                    <SearchBar
                                        value={productSearch}
                                        onChange={setProductSearch}
                                        placeholder="Buscar por Nombre, Marca o Código..."
                                    />
                                </FormField>
                                {productSearch && filteredProducts.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-sm)', marginTop: 4, zIndex: 11,
                                        maxHeight: 200, overflowY: 'auto'
                                    }}>
                                        {filteredProducts.map(p => (
                                            <div
                                                key={p.id}
                                                style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                                onClick={() => addProductToWO(p)}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.brand ? `[${p.brand}] ` : ''}{p.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stock: {p.stock_type === 'VOLUME' ? `${p.stock_ml/1000}L` : `${p.stock_quantity} uds`} | {formatCurrency(p.sell_price)}</div>
                                                </div>
                                                <Icon name="add_shopping_cart" size={18} style={{ color: 'var(--primary)' }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedProducts.length > 0 && (
                                <div style={{ background: 'var(--bg-hover)', borderRadius: 'var(--radius)', padding: 12, border: '1px solid var(--border)' }}>
                                    {selectedProducts.map(p => (
                                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatCurrency(p.sell_price)} x {p.qty} {p.stock_type === 'VOLUME' ? 'L' : 'uds'}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button className="btn btn-ghost btn-xs" onClick={() => updateProductQty(p.id, -1)} style={{ padding: '2px 6px' }} title="Disminuir cantidad">-</button>
                                                    <button className="btn btn-ghost btn-xs" onClick={() => updateProductQty(p.id, 1)} style={{ padding: '2px 6px' }} title="Aumentar cantidad">+</button>
                                                </div>
                                                <div style={{ fontWeight: 700, width: 80, textAlign: 'right' }}>{formatCurrency(p.sell_price * p.qty)}</div>
                                                <button className="btn btn-ghost btn-sm" onClick={() => removeProductFromWO(p.id)} style={{ color: 'var(--danger)', padding: 4 }} title="Eliminar producto"><Icon name="delete" size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ textAlign: 'right', borderTop: '1px solid var(--border)', paddingTop: 8, fontWeight: 700, color: 'var(--primary)' }}>
                                        Subtotal Repuestos: {formatCurrency(productsCost)}
                                    </div>
                                </div>
                            )}

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                            {/* Presupuesto manual separado */}
                            <SectionHeader icon="attach_money" title="Presupuesto" />
                            <FormRow>
                                <FormField label="Mano de Obra ($)">
                                    <input className="form-input" type="number" value={newOrder.labor_cost} onChange={e => setNewOrder({ ...newOrder, labor_cost: e.target.value })} style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }} />
                                </FormField>
                                <FormField label="Rentabilidad MO (%)">
                                    <input className="form-input" type="number" value={newOrder.labor_profit_percent} onChange={e => setNewOrder({ ...newOrder, labor_profit_percent: e.target.value })} style={{ fontSize: 18, fontWeight: 700 }} />
                                </FormField>
                                <FormField label="Repuestos Extras ($)">
                                    <input className="form-input" type="number" value={newOrder.parts_cost} onChange={e => setNewOrder({ ...newOrder, parts_cost: e.target.value })} style={{ fontSize: 18, fontWeight: 700 }} />
                                </FormField>
                            </FormRow>
                            <div style={{ textAlign: 'right', fontSize: 20, fontWeight: 800, padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                                Total OT: {formatCurrency(totalPrice)}
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                            <SectionHeader icon="engineering" title="Mecánicos o Gomeros" />
                            <FormField label="Asignar Profesionales (Se puede elegir varios)">
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', minHeight: 60, alignItems: 'center', justifyContent: 'center' }}>
                                    {mechanics.length === 0 ? (
                                        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                                            No hay mecánicos registrados o activos aún.
                                            <br />
                                            <small>(Podés crearlos en el menú "Personal y Accesos")</small>
                                        </div>
                                    ) : (
                                        mechanics.map(m => (
                                            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: newOrder.mechanic_ids.includes(m.id) ? 'var(--primary-light)' : 'var(--bg-hover)', borderRadius: 20, cursor: 'pointer', fontSize: 12 }}>
                                                <input type="checkbox" checked={newOrder.mechanic_ids.includes(m.id)} onChange={e => {
                                                    const ids = e.target.checked
                                                        ? [...newOrder.mechanic_ids, m.id]
                                                        : newOrder.mechanic_ids.filter(id => id !== m.id);
                                                    setNewOrder({ ...newOrder, mechanic_ids: ids });
                                                }} />
                                                {m.name}
                                            </label>
                                        ))
                                    )}
                                </div>
                            </FormField>
                            {selectedMechanics.length > 0 && laborCost > 0 && (
                                <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Comisión Base (Técnico 1):</span>
                                        <strong>{selectedMechanics[0].commission_rate}%</strong>
                                    </div>
                                    <FormField label="% Comisión para esta Orden (Se aplicará a todos)">
                                        <input className="form-input" type="number" step="0.1" placeholder={selectedMechanics[0].commission_rate}
                                            value={newOrder.applied_commission_rate}
                                            onChange={e => setNewOrder({ ...newOrder, applied_commission_rate: e.target.value })} />
                                    </FormField>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                                        <span style={{ fontWeight: 600 }}>Comisión Total a Repartir:</span>
                                        <strong style={{ color: 'var(--primary)' }}>
                                            {formatCurrency(laborCost * ((parseFloat(newOrder.applied_commission_rate) || selectedMechanics[0].commission_rate) / 100))}
                                        </strong>
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>* La comisión se divide equitativamente entre los mecánicos asignados.</div>
                                </div>
                            )}
                        </div>
                    </Modal>
                )}

                {printWO && (
                    <PrintableTicket workOrder={printWO} onClose={() => setPrintWO(null)} />
                )}

                {finalizeWO && (() => {
                    const wo = MOCK.workOrders.find(w => w.id === finalizeWO);
                    return (
                        <Modal title={`Finalizar OT #${wo?.order_number}`} onClose={() => setFinalizeWO(null)}>
                            <div style={{ padding: 12, marginBottom: 16, background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                    <FormField label="Mano de Obra ($)">
                                        <input type="number" className="form-input" value={editLabor} onChange={e => setEditLabor(e.target.value)} />
                                    </FormField>
                                    <FormField label="Repuestos Extras ($)">
                                        <input type="number" className="form-input" value={editParts} onChange={e => setEditParts(e.target.value)} />
                                    </FormField>
                                </div>
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Monto total a cobrar:</span>
                                    <span style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency((parseFloat(editLabor) || 0) + (parseFloat(editParts) || 0))}</span>
                                </div>
                            </div>

                            <FormField label="¿Emitir Factura AFIP para el Cierre de Caja?">
                                <select className="form-select" value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
                                    <option value="INTERNAL">Ticket Interno (No Fiscal)</option>
                                    <option value="FACTURA_B">Factura Electrónica B (AFIP)</option>
                                    <option value="FACTURA_A">Factura Electrónica A (AFIP)</option>
                                </select>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 8 }}>
                                    Al confirmar, el monto se registrará como ingreso en la caja diaria.
                                </small>
                            </FormField>

                            {invoiceType === 'FACTURA_A' && (
                                <FormField label="CUIT del Cliente" style={{ marginTop: 12 }}>
                                    <input
                                        className="form-input"
                                        placeholder="20123456789"
                                        value={customerCuit}
                                        onChange={e => setCustomerCuit(e.target.value.replace(/\D/g, ''))}
                                        maxLength={11}
                                    />
                                </FormField>
                            )}

                            <FormRow style={{ marginTop: 24, justifyContent: 'flex-end' }}>
                                <button className="btn btn-ghost" onClick={() => setFinalizeWO(null)} disabled={isFinalizing}>Cancelar</button>
                                <button className="btn btn-success" onClick={confirmFinalize} disabled={isFinalizing}>
                                    <Icon name={isFinalizing ? "hourglass_empty" : "check_circle"} size={20} />
                                    {isFinalizing ? 'PROCESANDO...' : 'FINALIZAR'}
                                </button>
                            </FormRow>
                        </Modal>
                    );
                })()}

                {vehicleSheet && (
                    <Modal title="Ficha Histórica del Vehículo" width="800px" onClose={() => setVehicleSheet(null)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="glass-card" style={{ padding: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
                                <Icon name="directions_car" size={48} style={{ color: 'var(--primary)' }} />
                                <div>
                                    <h3 style={{ fontSize: 24, margin: '0 0 4px 0' }}>{vehicleSheet.brand} {vehicleSheet.model}</h3>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                                        Patente: <strong style={{ color: 'var(--text-primary)' }}>{vehicleSheet.license_plate}</strong> |
                                        Año: <strong style={{ color: 'var(--text-primary)' }}>{vehicleSheet.year || 'N/A'}</strong> |
                                        Chasis: <strong style={{ color: 'var(--text-primary)' }}>{vehicleSheet.chassis_number || 'S/N'}</strong>
                                    </div>
                                </div>
                            </div>

                            <SectionHeader icon="history" title="Registro Histórico de Servicios" />

                            {MOCK.workOrders.filter(wo => wo.vehicle_id === vehicleSheet.id && (wo.status === 'Finalizado' || wo.status === 'Cobrado')).length === 0 ? (
                                <EmptyState icon="history" title="Sin historial" sub="Este vehículo no tiene trabajos completados en el sistema aún." />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
                                    {MOCK.workOrders
                                        .filter(wo => wo.vehicle_id === vehicleSheet.id && (wo.status === 'Finalizado' || wo.status === 'Cobrado'))
                                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                        .map(wo => (
                                            <div key={wo.id} style={{ background: 'var(--bg-hover)', padding: 16, borderRadius: 'var(--radius)', borderLeft: '4px solid var(--primary)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <strong style={{ fontSize: 13, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Icon name="event" size={14} />
                                                        {new Date(wo.created_at).toLocaleDateString('es-AR')}
                                                    </strong>
                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Km Registrado: {wo.km_at_entry ? wo.km_at_entry.toLocaleString('es-AR') : 'N/A'}</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{wo.description}</p>
                                                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
                                                    <span>OT #{wo.order_number}</span>
                                                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>{formatCurrency(wo.total_price)}</span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </Modal>
                )}
                {addingProductsToWO && (
                    <Modal title={`Agregar Productos a OT #${addingProductsToWO.order_number}`} onClose={() => setAddingProductsToWO(null)} width="600px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setAddingProductsToWO(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleAddExtraProducts} disabled={isAddingProducts || extraProducts.length === 0}>{isAddingProducts ? 'Guardando...' : 'Confirmar y Agregar'}</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Buscar Producto (Nombre o Código)">
                                <input className="form-input" value={extraProductSearch} onChange={e => setExtraProductSearch(e.target.value)} placeholder="Ej: Aceite, Filtro, 779..." />
                            </FormField>
                            {extraProductSearch && filteredExtraProducts.length > 0 && (
                                <div className="glass-card" style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {filteredExtraProducts.map(p => (
                                        <div key={p.id} className="search-result-item" style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4 }} onClick={() => {
                                            setExtraProducts(prev => {
                                                const existing = prev.find(item => item.id === p.id);
                                                if (existing) return prev.map(item => item.id === p.id ? { ...item, qty: item.qty + 1 } : item);
                                                return [...prev, { ...p, qty: 1 }];
                                            });
                                            setExtraProductSearch('');
                                        }}>
                                            <Icon name="add" size={16} /> <strong style={{ marginLeft: 8 }}>{p.name}</strong> — {formatCurrency(p.sell_price)}
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ marginTop: 8 }}>
                                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Productos a sumar:</label>
                                {extraProducts.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 8 }}>No hay productos seleccionados</div>}
                                {extraProducts.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8, marginBottom: 4 }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatCurrency(p.sell_price)} c/u</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <button className="btn btn-icon btn-sm" onClick={() => setExtraProducts(prev => prev.map(x => x.id === p.id ? { ...x, qty: Math.max(0.1, x.qty - 1) } : x).filter(x => x.qty > 0))}>-</button>
                                                <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{p.qty}</span>
                                                <button className="btn btn-icon btn-sm" onClick={() => setExtraProducts(prev => prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                                            </div>
                                            <button className="btn btn-icon btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setExtraProducts(prev => prev.filter(x => x.id !== p.id))}>
                                                <Icon name="close" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Modal>
                )}

                {editingWO && (
                    <Modal title="Editar Presupuesto de la Orden" onClose={() => setEditingWO(null)} width="400px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setEditingWO(null)}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveEditPrices}>Guardar Cambios</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Mano de Obra ($)">
                                <input type="number" className="form-input" style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }} value={editLabor} onChange={e => setEditLabor(e.target.value)} />
                            </FormField>
                            <FormField label="Repuestos Extras ($)">
                                <input type="number" className="form-input" style={{ fontSize: 18, fontWeight: 700 }} value={editParts} onChange={e => setEditParts(e.target.value)} />
                            </FormField>
                            <div style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', textAlign: 'right' }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monto Total Estimado:</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency((parseFloat(editLabor) || 0) + (parseFloat(editParts) || 0))}</div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};
