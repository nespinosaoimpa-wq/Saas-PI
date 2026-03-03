import React, { useState, Fragment } from 'react';
import { useApp } from '../context/AppContext';
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
    const { data: MOCK, addWorkOrder, getClientVehicles } = useApp();
    const [tab, setTab] = useState('active');
    const [showNew, setShowNew] = useState(false);
    const [printWO, setPrintWO] = useState(null);
    const [checklist, setChecklist] = useState({});

    const [newOrder, setNewOrder] = useState({ client_id: '', vehicle_id: '', box_id: '', km_at_entry: '', description: '' });

    const handleCreateWorkOrder = () => {
        if (!newOrder.client_id || !newOrder.vehicle_id || !newOrder.description) {
            alert('Por favor completá Cliente, Vehículo y Descripción.');
            return;
        }
        addWorkOrder({
            ...newOrder,
            status: newOrder.box_id ? 'En Box' : 'Pendiente',
            mechanic: newOrder.box_id ? 'Taller' : null,
            total_price: 0
        });
        setShowNew(false);
        setNewOrder({ client_id: '', vehicle_id: '', box_id: '', km_at_entry: '', description: '' });
        setChecklist({});
    };

    const filtered = MOCK.workOrders.filter(wo => {
        if (tab === 'active') return wo.status === 'Pendiente' || wo.status === 'En Box';
        if (tab === 'done') return wo.status === 'Finalizado';
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
                    {filtered.map(wo => (
                        <QueueCard
                            key={wo.id}
                            wo={wo}
                            onClick={() => {
                                if (wo.status === 'Finalizado' || wo.status === 'Cobrado') {
                                    setPrintWO(wo);
                                }
                            }}
                        />
                    ))}
                    {filtered.length === 0 && <EmptyState icon="assignment" title="Sin órdenes" sub="No hay órdenes para este filtro" />}
                </div>

                {showNew && (
                    <Modal title="Nueva Orden de Trabajo" onClose={() => setShowNew(false)} width="800px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleCreateWorkOrder}><Icon name="print" size={16} /> Crear y Generar Ticket</button></Fragment>}>
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
                                <FormField label="Box asignado">
                                    <select className="form-select" value={newOrder.box_id} onChange={e => setNewOrder({ ...newOrder, box_id: e.target.value })}>
                                        <option value="">Sin asignar</option>
                                        {MOCK.boxes.filter(b => b.status === 'Libre').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </FormField>
                                <FormField label="Km al ingresar">
                                    <input className="form-input" type="number" placeholder="Km actual" value={newOrder.km_at_entry} onChange={e => setNewOrder({ ...newOrder, km_at_entry: e.target.value })} />
                                </FormField>
                            </FormRow>
                            <FormField label="Descripción del trabajo">
                                <textarea className="form-textarea" placeholder="Describir el trabajo a realizar..." value={newOrder.description} onChange={e => setNewOrder({ ...newOrder, description: e.target.value })} />
                            </FormField>
                            <FormField label="Fotos del vehículo">
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-ghost" style={{ flex: 1 }}><Icon name="photo_camera" size={18} /> Tomar Fotos</button>
                                    <button className="btn btn-ghost" style={{ flex: 1 }}><Icon name="upload_file" size={18} /> Subir Archivos</button>
                                </div>
                            </FormField>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                            <SectionHeader icon="checklist" title="Checklist de Seguridad" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {MOCK.checklist_template.map(item => (
                                    <CheckItem key={item.key} label={item.label} sub={item.group} checked={checklist[item.key]} onChange={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                                ))}
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                            <SectionHeader icon="calculate" title="Precio Dinámico" />
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fórmula: (Insumo × Cantidad) + (Mano de Obra × Factor Dificultad del vehículo)</p>
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
