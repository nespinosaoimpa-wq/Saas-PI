import React, { useState, Fragment } from 'react';
import { MOCK, getClientVehicles } from '../data/data';
import {
    SearchBar,
    DataTable,
    Modal,
    SectionHeader,
    HealthRing,
    FormRow,
    FormField,
    Icon
} from '../components/ui';

export const ClientsPage = () => {
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [showNewModal, setShowNewModal] = useState(false);

    const filtered = MOCK.clients.filter(c =>
        `${c.first_name} ${c.last_name} ${c.phone} ${c.dni}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 250 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar cliente por nombre, telÃ©fono o DNI..." /></div>
                    <button className="btn btn-primary" onClick={() => setShowNewModal(true)}><Icon name="person_add" size={18} /> Nuevo Cliente</button>
                    <button className="btn btn-ghost"><Icon name="group" size={18} /> Cliente Existente</button>
                </div>

                <DataTable
                    columns={[
                        { key: 'name', label: 'Cliente', render: r => <div><strong>{r.first_name} {r.last_name}</strong>{r.is_frequent && <span style={{ marginLeft: 8, fontSize: 9, color: 'var(--alert)', fontWeight: 700 }}>â˜… FRECUENTE</span>}</div> },
                        { key: 'phone', label: 'TelÃ©fono' },
                        { key: 'email', label: 'Email' },
                        { key: 'dni', label: 'DNI' },
                        { key: 'vehicles', label: 'VehÃ­culos', render: r => <span className="nav-badge">{r.vehicles.length}</span> },
                        { key: 'actions', label: '', render: r => <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); setSelectedClient(r); }}>Ver Ficha</button> },
                    ]}
                    data={filtered}
                    onRowClick={r => setSelectedClient(r)}
                />

                {selectedClient && (
                    <Modal title={`Ficha: ${selectedClient.first_name} ${selectedClient.last_name}`} onClose={() => setSelectedClient(null)} width="800px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setSelectedClient(null)}>Cerrar</button><button className="btn btn-primary">Editar Cliente</button></Fragment>}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                            <FormField label="TelÃ©fono"><div style={{ fontSize: 14, fontWeight: 600, padding: '10px 0' }}>{selectedClient.phone}</div></FormField>
                            <FormField label="Email"><div style={{ fontSize: 14, fontWeight: 600, padding: '10px 0' }}>{selectedClient.email}</div></FormField>
                            <FormField label="DNI"><div style={{ fontSize: 14, fontWeight: 600, padding: '10px 0' }}>{selectedClient.dni}</div></FormField>
                            <FormField label="Estado"><div style={{ padding: '10px 0' }}>{selectedClient.is_frequent ? <span className="badge badge-done">Frecuente</span> : <span className="badge badge-pending">Normal</span>}</div></FormField>
                        </div>
                        <SectionHeader icon="directions_car" title="VehÃ­culos" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {getClientVehicles(selectedClient.id).map(v => (
                                <div key={v.id} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{v.brand} {v.model} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({v.year})</span></div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Patente: <strong style={{ color: 'var(--primary)' }}>{v.license_plate}</strong> â€¢ {v.km.toLocaleString()} km â€¢ Color: {v.color}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Factor dificultad: Ã—{v.difficulty_factor}</div>
                                    </div>
                                    <HealthRing score={v.health_score} size={52} />
                                </div>
                            ))}
                        </div>
                    </Modal>
                )}

                {showNewModal && (
                    <Modal title="Nuevo Cliente" onClose={() => setShowNewModal(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNewModal(false)}>Cancelar</button><button className="btn btn-primary">Guardar</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormRow>
                                <FormField label="Nombre"><input className="form-input" placeholder="Nombre" /></FormField>
                                <FormField label="Apellido"><input className="form-input" placeholder="Apellido" /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="TelÃ©fono"><input className="form-input" placeholder="11-XXXX-XXXX" /></FormField>
                                <FormField label="DNI"><input className="form-input" placeholder="DNI" /></FormField>
                            </FormRow>
                            <FormField label="Email"><input className="form-input" placeholder="email@ejemplo.com" type="email" /></FormField>
                            <FormField label="DirecciÃ³n"><input className="form-input" placeholder="DirecciÃ³n" /></FormField>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                            <h4 style={{ fontSize: 14, fontWeight: 700 }}>Agregar VehÃ­culo</h4>
                            <FormRow>
                                <FormField label="Patente"><input className="form-input" placeholder="AA 000 BB" /></FormField>
                                <FormField label="Marca"><input className="form-input" placeholder="Ej: Toyota" /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Modelo"><input className="form-input" placeholder="Ej: Corolla" /></FormField>
                                <FormField label="AÃ±o"><input className="form-input" type="number" placeholder="2024" /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Kilometraje"><input className="form-input" type="number" placeholder="0" /></FormField>
                                <FormField label="Color"><input className="form-input" placeholder="Color" /></FormField>
                            </FormRow>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};
