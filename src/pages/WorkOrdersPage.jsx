import React, { useState, Fragment, useEffect } from 'react';
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
    PrintableTicket
} from '../components/ui';

export const WorkOrdersPage = () => {
    const { data: MOCK, getClientVehicles, addWorkOrder, updateWorkOrder } = useApp();
    const { employees } = useAuth();
    const mechanics = employees.filter(e => e.role === 'mecanico' || e.role === 'gomero');

    const [tab, setTab] = useState('active');
    const [showNew, setShowNew] = useState(false);
    const [printWO, setPrintWO] = useState(null);
    const [editingOrder, setEditingOrder] = useState(null);

    const [newOrder, setNewOrder] = useState({
        client_id: '', vehicle_id: '', box_id: '', km_at_entry: '',
        description: '', labor_cost: '', parts_cost: '', mechanic_id: '', status: ''
    });

    useEffect(() => {
        if (editingOrder) {
            setNewOrder({
                client_id: editingOrder.client_id || '',
                vehicle_id: editingOrder.vehicle_id || '',
                box_id: editingOrder.box_id || '',
                km_at_entry: editingOrder.km_at_entry || '',
                description: editingOrder.description || '',
                labor_cost: editingOrder.labor_cost || '',
                parts_cost: editingOrder.parts_cost || '',
                mechanic_id: editingOrder.mechanic_id || '',
                status: editingOrder.status || ''
            });
            setShowNew(true);
        }
    }, [editingOrder]);

    const laborCost = parseFloat(newOrder.labor_cost) || 0;
    const partsCost = parseFloat(newOrder.parts_cost) || 0;
    const totalPrice = laborCost + partsCost;

    const selectedMechanic = mechanics.find(m => m.id === newOrder.mechanic_id);

    const handleCreateOrUpdate = async () => {
        if (!newOrder.client_id || !newOrder.vehicle_id || !newOrder.description) {
            alert('Por favor completá Cliente, Vehículo y Descripción.');
            return;
        }

        const appliedCommission = selectedMechanic ? selectedMechanic.commission_rate : 0;

        const payload = {
            ...newOrder,
            labor_cost: laborCost,
            parts_cost: partsCost,
            total_price: totalPrice,
            applied_commission_rate: appliedCommission
        };

        if (editingOrder) {
            await updateWorkOrder(editingOrder.id, payload);
        } else {
            await addWorkOrder(payload);
        }

        closeModal();
    };

    const closeModal = () => {
        setShowNew(false);
        setEditingOrder(null);
        setNewOrder({ client_id: '', vehicle_id: '', box_id: '', km_at_entry: '', description: '', labor_cost: '', parts_cost: '', mechanic_id: '', status: '' });
    };

    const filtered = MOCK.workOrders.filter(wo => {
        if (tab === 'active') return !['Finalizado', 'Cobrado', 'Cancelado'].includes(wo.status);
        if (tab === 'done') return ['Finalizado', 'Cobrado'].includes(wo.status);
        return true;
    });

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs tabs={[{ key: 'active', label: 'Activas' }, { key: 'done', label: 'Finalizadas' }, { key: 'all', label: 'Todas' }]} active={tab} onChange={setTab} />
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="add_circle" size={18} /> Nueva OT</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map(wo => {
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
                                onClick={() => setEditingOrder(wo)}
                            />
                        );
                    })}
                    {filtered.length === 0 && <EmptyState icon="assignment" title="Sin órdenes" sub="No hay órdenes para este filtro" />}
                </div>

                {showNew && (
                    <Modal title={editingOrder ? `OT #${editingOrder.order_number} - Editar` : "Nueva Orden de Trabajo"} onClose={closeModal} width="800px"
                        footer={<Fragment>
                            {editingOrder && (['Finalizado', 'Cobrado'].includes(editingOrder.status)) && (
                                <button className="btn btn-ghost" style={{ marginRight: 'auto', color: 'var(--primary)' }} onClick={() => setPrintWO(editingOrder)}>
                                    <Icon name="print" size={16} /> Imprimir Ticket
                                </button>
                            )}
                            <button className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleCreateOrUpdate}><Icon name="save" size={16} /> Guardar OT</button>
                        </Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormRow>
                                <FormField label="Cliente">
                                    <select className="form-select" value={newOrder.client_id} onChange={e => setNewOrder({ ...newOrder, client_id: e.target.value, vehicle_id: '' })}>
                                        <option value="">Seleccionar cliente...</option>
                                        {MOCK.clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Vehículo">
                                    <select className="form-select" value={newOrder.vehicle_id} onChange={e => setNewOrder({ ...newOrder, vehicle_id: e.target.value })} disabled={!newOrder.client_id}>
                                        <option value="">Seleccionar vehículo...</option>
                                        {newOrder.client_id ? getClientVehicles(newOrder.client_id).map(v => <option key={v.id} value={v.id}>{v.license_plate} - {v.brand} {v.model}</option>) : null}
                                    </select>
                                </FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Estado de la OT">
                                    <select className="form-select" value={newOrder.status} onChange={e => setNewOrder({ ...newOrder, status: e.target.value })}>
                                        <option value="">(Automático)</option>
                                        <option value="Recepción">Recepción (Ingresado)</option>
                                        <option value="Diagnóstico">Diagnóstico</option>
                                        <option value="Presupuestado">Presupuestado</option>
                                        <option value="Esperando Aprobación">Esperando Aprobación</option>
                                        <option value="En Box">En Box (Ejecutando)</option>
                                        <option value="Finalizado">Finalizado (Listo para entregar)</option>
                                        <option value="Cobrado">Cobrado / Entregado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </FormField>
                                <FormField label="Box asignado">
                                    <select className="form-select" value={newOrder.box_id} onChange={e => setNewOrder({ ...newOrder, box_id: e.target.value })}>
                                        <option value="">Sin asignar</option>
                                        {MOCK.boxes.map(b => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
                                    </select>
                                </FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Km al ingresar">
                                    <input className="form-input" type="number" placeholder="Ej: 85000" value={newOrder.km_at_entry} onChange={e => setNewOrder({ ...newOrder, km_at_entry: e.target.value })} />
                                </FormField>
                                <div style={{ flex: 1 }} />
                            </FormRow>
                            <FormField label="Descripción del trabajo / Informe Técnico">
                                <textarea className="form-textarea" placeholder="Describir el síntoma, diagnóstico o trabajo a realizar..." value={newOrder.description} onChange={e => setNewOrder({ ...newOrder, description: e.target.value })} />
                            </FormField>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                            {/* Presupuesto manual separado */}
                            <SectionHeader icon="attach_money" title={newOrder.status === 'Presupuestado' || newOrder.status === 'Esperando Aprobación' ? "Presupuesto Estimado" : "Costos (Ejecución)"} />
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

                            <SectionHeader icon="engineering" title="Mecánico o Gomero Asignado" />
                            <FormField label="Asignar Profesional">
                                <select className="form-select" value={newOrder.mechanic_id} onChange={e => setNewOrder({ ...newOrder, mechanic_id: e.target.value })}>
                                    <option value="">Sin asignar</option>
                                    {mechanics.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role.toUpperCase()}) - {parseFloat(m.commission_rate)}% comisión base</option>)}
                                </select>
                            </FormField>
                            {selectedMechanic && laborCost > 0 && (
                                <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Mano de obra: {formatCurrency(laborCost)}. Comisión estimada <strong>({selectedMechanic.commission_rate}% de la mano de obra)</strong>:</span>
                                    <strong style={{ color: 'var(--primary)' }}>
                                        {formatCurrency(laborCost * (selectedMechanic.commission_rate / 100))}
                                    </strong>
                                </div>
                            )}
                        </div>
                    </Modal>
                )}

                {printWO && (
                    <PrintableTicket workOrder={printWO} onClose={() => setPrintWO(null)} />
                )}
            </div>
        </div>
    );
};

