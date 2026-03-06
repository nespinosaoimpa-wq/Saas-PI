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
    const { data: MOCK, getClientVehicles, addWorkOrder, exportToExcel, updateWorkOrder } = useApp();
    const { employees } = useAuth();
    const mechanics = employees.filter(e => e.role === 'mecanico' || e.role === 'gomero');

    const [tab, setTab] = useState('active');
    const [showNew, setShowNew] = useState(false);
    const [printWO, setPrintWO] = useState(null);
    const [vehicleSheet, setVehicleSheet] = useState(null);

    const [finalizeWO, setFinalizeWO] = useState(null); // woId to finalize
    const [invoiceType, setInvoiceType] = useState('INTERNAL');
    const [isFinalizing, setIsFinalizing] = useState(false);

    const handleFinalizeClick = (e, woId) => {
        e.stopPropagation();
        setFinalizeWO(woId);
        setInvoiceType('INTERNAL');
    };

    const confirmFinalize = async () => {
        if (!finalizeWO) return;
        setIsFinalizing(true);
        try {
            const wo = MOCK.workOrders.find(w => w.id === finalizeWO);
            if (!wo) throw new Error("OT no encontrada");

            let afipData = null;
            if (invoiceType === 'FACTURA_B') {
                afipData = await MOCK.generateAFIPInvoice({
                    amount: wo.total_price || 0,
                    docType: 99,
                    docNumber: 0,
                    billType: 6 // Factura B
                });
            }

            await updateWorkOrder(finalizeWO, {
                status: 'Finalizado',
                completed_at: new Date().toISOString()
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
        description: '', labor_cost: '', parts_cost: '', mechanic_id: '',
        applied_commission_rate: ''
    });

    // Nuevo estado para la búsqueda interactiva
    const [clientSearch, setClientSearch] = useState('');

    const laborCost = parseFloat(newOrder.labor_cost) || 0;
    const partsCost = parseFloat(newOrder.parts_cost) || 0;
    const totalPrice = laborCost + partsCost;

    const selectedMechanic = mechanics.find(m => m.id === newOrder.mechanic_id);

    const handleCreateWorkOrder = async () => {
        if (!newOrder.client_id || !newOrder.vehicle_id || !newOrder.description) {
            alert('Por favor completá Cliente, Vehículo y Descripción.');
            return;
        }

        const createdWO = await addWorkOrder({
            ...newOrder,
            labor_cost: laborCost,
            parts_cost: partsCost,
            total_price: totalPrice,
            applied_commission_rate: parseFloat(newOrder.applied_commission_rate) || (selectedMechanic ? selectedMechanic.commission_rate : 0)
        });

        alert('✅ Orden de Trabajo creada con éxito.');
        setShowNew(false);
        setNewOrder({ client_id: '', vehicle_id: '', box_id: '', km_at_entry: '', description: '', labor_cost: '', parts_cost: '', mechanic_id: '', applied_commission_rate: '' });
        setClientSearch('');
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

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs tabs={[{ key: 'active', label: 'Activas' }, { key: 'done', label: 'Finalizadas' }, { key: 'all', label: 'Todas' }]} active={tab} onChange={setTab} />
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-ghost" onClick={() => exportToExcel('work_orders')}>
                        <Icon name="download" size={18} /> Exportar Excel
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="add_circle" size={18} /> Nueva OT</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map(wo => {
                        // Adaptar el UI de QueueCard a los datos relacionales de Supabase
                        const clientName = wo.clients ? `${wo.clients.first_name} ${wo.clients.last_name}` : 'Cliente Sin Nombre';
                        const vehicleName = wo.vehicles ? `${wo.vehicles.license_plate} - ${wo.vehicles.brand} ${wo.vehicles.model}` : 'Vehículo';
                        const mechanicName = employees.find(e => e.id === wo.mechanic_id)?.name || 'Sin Asignar';
                        const boxName = MOCK.boxes.find(b => b.id === wo.box_id)?.name || 'Sin Box';

                        return (
                            <QueueCard
                                key={wo.id}
                                wo={{
                                    ...wo,
                                    client: clientName,
                                    vehicle: vehicleName,
                                    mechanic: mechanicName,
                                    box: boxName
                                }}
                                onViewVehicle={setVehicleSheet}
                                rightAction={
                                    (wo.status === 'Pendiente' || wo.status === 'En Box') ? (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={(e) => handleFinalizeClick(e, wo.id)}
                                            style={{ height: 32, padding: '0 12px', fontSize: 12, fontWeight: 700 }}
                                        >
                                            FINALIZAR
                                        </button>
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
                                        {MOCK.boxes.map(b => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
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

                            {/* Presupuesto manual separado */}
                            <SectionHeader icon="attach_money" title="Presupuesto" />
                            <FormRow>
                                <FormField label="Mano de Obra ($)">
                                    <input className="form-input" type="number" value={newOrder.labor_cost} onChange={e => setNewOrder({ ...newOrder, labor_cost: e.target.value })} style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)' }} />
                                </FormField>
                                <FormField label="Repuestos/Materiales ($)">
                                    <input className="form-input" type="number" value={newOrder.parts_cost} onChange={e => setNewOrder({ ...newOrder, parts_cost: e.target.value })} style={{ fontSize: 18, fontWeight: 700 }} />
                                </FormField>
                            </FormRow>
                            <div style={{ textAlign: 'right', fontSize: 20, fontWeight: 800, padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                                Total OT: {formatCurrency(totalPrice)}
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                            <SectionHeader icon="engineering" title="Mecánico o Gomero" />
                            <FormField label="Asignar Profesional">
                                <select className="form-select" value={newOrder.mechanic_id} onChange={e => setNewOrder({ ...newOrder, mechanic_id: e.target.value })}>
                                    <option value="">Sin asignar</option>
                                    {mechanics.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role.toUpperCase()}) - {parseFloat(m.commission_rate)}% comisión base</option>)}
                                </select>
                            </FormField>
                            {selectedMechanic && laborCost > 0 && (
                                <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Comisión Base del Técnico:</span>
                                        <strong>{selectedMechanic.commission_rate}%</strong>
                                    </div>
                                    <FormField label="% Comisión para esta Orden (Opcional)">
                                        <input className="form-input" type="number" step="0.1" placeholder={selectedMechanic.commission_rate}
                                            value={newOrder.applied_commission_rate}
                                            onChange={e => setNewOrder({ ...newOrder, applied_commission_rate: e.target.value })} />
                                    </FormField>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                                        <span style={{ fontWeight: 600 }}>Comisión Final:</span>
                                        <strong style={{ color: 'var(--primary)' }}>
                                            {formatCurrency(laborCost * ((parseFloat(newOrder.applied_commission_rate) || selectedMechanic.commission_rate) / 100))}
                                        </strong>
                                    </div>
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
                                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Monto a cobrar:</div>
                                <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--primary)' }}>{formatCurrency(wo?.total_price || 0)}</div>
                            </div>

                            <FormField label="¿Emitir Factura AFIP para el Cierre de Caja?">
                                <select className="form-select" value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
                                    <option value="INTERNAL">Ticket Interno (No Fiscal)</option>
                                    <option value="FACTURA_B">Factura Electrónica B (AFIP)</option>
                                </select>
                                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 8 }}>
                                    Al confirmar, el monto se registrará como ingreso en la caja diaria.
                                </small>
                            </FormField>

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
            </div>
        </div>
    );
};
