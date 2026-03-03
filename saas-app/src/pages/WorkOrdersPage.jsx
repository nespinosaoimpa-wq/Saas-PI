import React, { useState, Fragment } from 'react';
import { formatCurrency } from '../data/data';
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

    const [newOrder, setNewOrder] = useState({ client_id: '', vehicle_id: '', box_id: '', km_at_entry: '', description: '', total_price: '' });

    // Multi-mecánico: lista de técnicos disponibles (de los boxes)
    const availableTechs = [...new Set(
        MOCK.boxes.map(b => b.mechanic).filter(Boolean)
            .concat(MOCK.workOrders.map(wo => wo.mechanic).filter(Boolean))
    )];

    // Estado de mecánicos asignados: { name: string, commission_percent: number, selected: boolean }
    const [assignedMechanics, setAssignedMechanics] = useState(
        availableTechs.map(name => ({ name, selected: false, commission_percent: 15 }))
    );

    const toggleMechanic = (name) => {
        setAssignedMechanics(prev => prev.map(m => m.name === name ? { ...m, selected: !m.selected } : m));
    };

    const setMechanicPercent = (name, percent) => {
        setAssignedMechanics(prev => prev.map(m => m.name === name ? { ...m, commission_percent: parseFloat(percent) || 0 } : m));
    };

    const totalPrice = parseFloat(newOrder.total_price) || 0;
    const selectedMechanics = assignedMechanics.filter(m => m.selected);

    const handleCreateWorkOrder = () => {
        if (!newOrder.client_id || !newOrder.vehicle_id || !newOrder.description) {
            alert('Por favor completá Cliente, Vehículo y Descripción.');
            return;
        }

        const mechanics = selectedMechanics.map(m => ({
            name: m.name,
            commission_percent: m.commission_percent,
            commission_amount: totalPrice * (m.commission_percent / 100)
        }));

        addWorkOrder({
            ...newOrder,
            total_price: totalPrice,
            status: newOrder.box_id ? 'En Box' : 'Pendiente',
            mechanic: mechanics.length > 0 ? mechanics.map(m => m.name).join(', ') : null,
            mechanics // array detallado
        });
        setShowNew(false);
        setNewOrder({ client_id: '', vehicle_id: '', box_id: '', km_at_entry: '', description: '', total_price: '' });
        setChecklist({});
        setAssignedMechanics(availableTechs.map(name => ({ name, selected: false, commission_percent: 15 })));
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

                            {/* Presupuesto manual */}
                            <SectionHeader icon="attach_money" title="Presupuesto" />
                            <FormRow>
                                <FormField label="Precio Total del Trabajo ($)">
                                    <input className="form-input" type="number" placeholder="Ej: 45000" value={newOrder.total_price} onChange={e => setNewOrder({ ...newOrder, total_price: e.target.value })} style={{ fontSize: 18, fontWeight: 700 }} />
                                </FormField>
                            </FormRow>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Incluye mano de obra + repuestos. Podrás ajustarlo después.</p>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                            {/* Mecánicos multi-asignación */}
                            <SectionHeader icon="engineering" title="Mecánicos Asignados y Comisiones" />
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Selectá los mecánicos que participan. Podés poner un porcentaje distinto a cada uno.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {assignedMechanics.map(m => (
                                    <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: m.selected ? 'var(--bg-hover)' : 'transparent', borderRadius: 'var(--radius-sm)', border: m.selected ? '1px solid var(--primary)' : '1px solid var(--border)', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={m.selected} onChange={() => toggleMechanic(m.name)} style={{ width: 18, height: 18 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                                        </div>
                                        {m.selected && (
                                            <>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <input className="form-input" type="number" value={m.commission_percent} onChange={e => setMechanicPercent(m.name, e.target.value)} style={{ width: 60, textAlign: 'center', padding: '4px 6px', fontSize: 13 }} />
                                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>%</span>
                                                </div>
                                                <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                                                    {formatCurrency(totalPrice * (m.commission_percent / 100))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {selectedMechanics.length > 0 && totalPrice > 0 && (
                                <div style={{ marginTop: 8, padding: 8, background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Total comisiones ({selectedMechanics.length} mecánico{selectedMechanics.length > 1 ? 's' : ''}):</span>
                                    <strong style={{ color: 'var(--primary)' }}>
                                        {formatCurrency(selectedMechanics.reduce((s, m) => s + totalPrice * (m.commission_percent / 100), 0))}
                                    </strong>
                                </div>
                            )}

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                            <SectionHeader icon="checklist" title="Checklist de Seguridad" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {MOCK.checklist_template.map(item => (
                                    <CheckItem key={item.key} label={item.label} sub={item.group} checked={checklist[item.key]} onChange={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                                ))}
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
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
