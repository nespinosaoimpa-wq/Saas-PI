import React, { useState, Fragment } from 'react';
import { MOCK } from '../data/data';
import {
    Tabs,
    QueueCard,
    EmptyState,
    Modal,
    FormRow,
    FormField,
    SectionHeader,
    CheckItem,
    Icon
} from '../components/ui';

export const WorkOrdersPage = () => {
    const [tab, setTab] = useState('active');
    const [showNew, setShowNew] = useState(false);
    const [checklist, setChecklist] = useState({});

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
                    {filtered.map(wo => <QueueCard key={wo.id} wo={wo} />)}
                    {filtered.length === 0 && <EmptyState icon="assignment" title="Sin Ã³rdenes" sub="No hay Ã³rdenes para este filtro" />}
                </div>

                {showNew && (
                    <Modal title="Nueva Orden de Trabajo" onClose={() => setShowNew(false)} width="800px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button><button className="btn btn-primary"><Icon name="print" size={16} /> Crear y Generar Ticket</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormRow>
                                <FormField label="Cliente">
                                    <select className="form-select"><option value="">Seleccionar cliente...</option>{MOCK.clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select>
                                </FormField>
                                <FormField label="VehÃ­culo">
                                    <select className="form-select"><option value="">Seleccionar vehÃ­culo...</option>{MOCK.vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate} - {v.brand} {v.model}</option>)}</select>
                                </FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Box asignado">
                                    <select className="form-select"><option value="">Sin asignar</option>{MOCK.boxes.filter(b => b.status === 'Libre').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                                </FormField>
                                <FormField label="Km al ingresar"><input className="form-input" type="number" placeholder="Km actual" /></FormField>
                            </FormRow>
                            <FormField label="DescripciÃ³n del trabajo"><textarea className="form-textarea" placeholder="Describir el trabajo a realizar..." /></FormField>
                            <FormField label="Fotos del vehÃ­culo">
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
                            <SectionHeader icon="calculate" title="Precio DinÃ¡mico" />
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>FÃ³rmula: (Insumo Ã— Cantidad) + (Mano de Obra Ã— Factor Dificultad del vehÃ­culo)</p>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};
