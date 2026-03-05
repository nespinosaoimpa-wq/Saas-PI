import React, { useState, Fragment, useMemo } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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
    const {
        data: MOCK, getClientVehicles, getVehicleHistory,
        addClient, updateClient, addVehicle, addVehicleNote
    } = useApp();
    const { employees } = useAuth();

    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // Modals
    const [showNewModal, setShowNewModal] = useState(false);
    const [showEditClient, setShowEditClient] = useState(false);
    const [showAddVehicle, setShowAddVehicle] = useState(false);
    const [showNewNote, setShowNewNote] = useState(false);

    // Forms
    const [newClient, setNewClient] = useState({ first_name: '', last_name: '', phone: '', dni: '' });
    const [newVehicle, setNewVehicle] = useState({ license_plate: '', brand: '', model: '', year: '' });
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', email: '', dni: '' });
    const [addVehicleForm, setAddVehicleForm] = useState({ license_plate: '', brand: '', model: '', year: '', km: '' });
    const [noteForm, setNoteForm] = useState({ description: '', km: '', cost: '', technician: '' });
    const [saving, setSaving] = useState(false);

    // =============================================
    // Handlers
    // =============================================
    const handleSaveNew = async () => {
        if (!newClient.first_name || !newClient.last_name || !newVehicle.license_plate) {
            alert('Por favor completá los campos obligatorios (Nombre, Apellido y Patente).');
            return;
        }
        setSaving(true);
        try {
            const createdClient = await addClient({ ...newClient, is_frequent: false });
            await addVehicle({ ...newVehicle, client_id: createdClient.id, km: 0, difficulty_factor: 1.0, color: 'N/A' });
            setShowNewModal(false);
            setNewClient({ first_name: '', last_name: '', phone: '', dni: '' });
            setNewVehicle({ license_plate: '', brand: '', model: '', year: '' });
        } catch (error) {
            alert('Hubo un error al guardar. Intente nuevamente.');
        }
        setSaving(false);
    };

    const handleEditClient = () => {
        setEditForm({
            first_name: selectedClient.first_name || '',
            last_name: selectedClient.last_name || '',
            phone: selectedClient.phone || '',
            email: selectedClient.email || '',
            dni: selectedClient.dni || ''
        });
        setShowEditClient(true);
    };

    const handleSaveEditClient = async () => {
        if (!editForm.first_name || !editForm.last_name) {
            alert('Nombre y Apellido son obligatorios.');
            return;
        }
        setSaving(true);
        try {
            const updated = await updateClient(selectedClient.id, editForm);
            setSelectedClient({ ...selectedClient, ...updated });
            setShowEditClient(false);
        } catch (error) {
            alert('Error al actualizar el cliente.');
        }
        setSaving(false);
    };

    const handleOpenAddVehicle = () => {
        setAddVehicleForm({ license_plate: '', brand: '', model: '', year: '', km: '' });
        setShowAddVehicle(true);
    };

    const handleSaveNewVehicle = async () => {
        if (!addVehicleForm.license_plate || !addVehicleForm.brand || !addVehicleForm.model) {
            alert('Patente, Marca y Modelo son obligatorios.');
            return;
        }
        setSaving(true);
        try {
            await addVehicle({
                ...addVehicleForm,
                client_id: selectedClient.id,
                difficulty_factor: 1.0
            });
            setShowAddVehicle(false);
        } catch (error) {
            if (error?.code === '23505') {
                alert('Ya existe un vehículo con esa patente.');
            } else {
                alert('Error al guardar el vehículo.');
            }
        }
        setSaving(false);
    };

    const handleOpenNewNote = () => {
        setNoteForm({ description: '', km: '', cost: '', technician: '' });
        setShowNewNote(true);
    };

    const handleSaveNote = async () => {
        if (!noteForm.description) {
            alert('La descripción es obligatoria.');
            return;
        }
        setSaving(true);
        try {
            await addVehicleNote({
                vehicle_id: selectedVehicle.id,
                ...noteForm
            });
            setShowNewNote(false);
        } catch (error) {
            alert('Error al guardar la nota.');
        }
        setSaving(false);
    };

    // =============================================
    // Data
    // =============================================
    const filtered = MOCK.clients.filter(c =>
        `${c.first_name} ${c.last_name} ${c.phone} ${c.dni}`.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSelectedVehicle(null);
    };

    // Historial unificado del vehículo seleccionado
    const vehicleHistory = useMemo(() => {
        if (!selectedVehicle) return [];
        return getVehicleHistory(selectedVehicle.id);
    }, [selectedVehicle, MOCK.workOrders, MOCK.vehicleNotes]);

    // Resolver nombre del mecánico por ID
    const getMechanicName = (mechanicId) => {
        if (!mechanicId || mechanicId === 'N/A') return 'N/A';
        const emp = employees?.find(e => e.id === mechanicId);
        return emp ? emp.name : mechanicId;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Sin fecha';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // =============================================
    // Render
    // =============================================
    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 250 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar cliente por nombre, teléfono o DNI..." /></div>
                    <button className="btn btn-primary" onClick={() => setShowNewModal(true)}><Icon name="person_add" size={18} /> Nuevo Cliente</button>
                </div>

                <DataTable
                    columns={[
                        { key: 'name', label: 'Cliente', render: r => <div><strong>{r.first_name} {r.last_name}</strong>{r.is_frequent && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>★ FRECUENTE</span>}</div> },
                        { key: 'phone', label: 'Teléfono' },
                        { key: 'dni', label: 'DNI' },
                        { key: 'vehicles', label: 'Vehículos', render: r => <span className="nav-badge" style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>{getClientVehicles(r.id).length}</span> },
                        { key: 'actions', label: '', render: r => <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); handleSelectClient(r); }}>Ver Ficha</button> },
                    ]}
                    data={filtered}
                    onRowClick={r => handleSelectClient(r)}
                />

                {/* ==========================================
                    MODAL: FICHA DEL CLIENTE
                ========================================== */}
                {selectedClient && (
                    <Modal
                        title={`Ficha: ${selectedClient.first_name} ${selectedClient.last_name}`}
                        onClose={() => setSelectedClient(null)}
                        width="900px"
                        footer={<Fragment>
                            <button className="btn btn-ghost" onClick={() => setSelectedClient(null)}>Cerrar</button>
                            <button className="btn btn-primary" onClick={handleEditClient}><Icon name="edit" size={16} /> Editar Datos</button>
                        </Fragment>}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) 1.5fr', gap: 24 }}>
                            {/* Profile + Vehicles */}
                            <div>
                                <div style={{ background: 'var(--bg-base)', padding: 18, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>Datos Personales</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Tel:</strong> {selectedClient.phone || '—'}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {selectedClient.email || '—'}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>DNI:</strong> {selectedClient.dni || '—'}</div>
                                        <div style={{ marginTop: 8 }}>
                                            {selectedClient.is_frequent ? <span className="badge badge-done">Cliente Frecuente</span> : <span className="badge badge-pending">Cliente Normal</span>}
                                        </div>
                                    </div>
                                </div>

                                <SectionHeader icon="directions_car" title="Vehículos" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {getClientVehicles(selectedClient.id).map(v => (
                                        <div
                                            key={v.id}
                                            className="glass-card"
                                            style={{
                                                padding: 14, cursor: 'pointer',
                                                borderLeft: selectedVehicle?.id === v.id ? '3px solid var(--primary)' : undefined,
                                                background: selectedVehicle?.id === v.id ? 'rgba(var(--primary-rgb), 0.05)' : undefined
                                            }}
                                            onClick={() => setSelectedVehicle(v)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{v.brand} {v.model}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.license_plate} • {(v.km || 0).toLocaleString()} km</div>
                                                </div>
                                                <HealthRing score={v.health_score} size={38} />
                                            </div>
                                        </div>
                                    ))}
                                    <button className="btn btn-ghost btn-sm" style={{ borderStyle: 'dashed', justifyContent: 'center' }} onClick={handleOpenAddVehicle}>
                                        <Icon name="add" size={16} /> Agregar Vehículo
                                    </button>
                                </div>
                            </div>

                            {/* History Panel */}
                            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
                                {selectedVehicle ? (
                                    <Fragment>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <div>
                                                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                                                    {selectedVehicle.brand} {selectedVehicle.model}
                                                </h3>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                    {selectedVehicle.license_plate} • {selectedVehicle.year || '—'} • {(selectedVehicle.km || 0).toLocaleString()} km
                                                </div>
                                            </div>
                                            <button className="btn btn-primary btn-sm" onClick={handleOpenNewNote}><Icon name="add_notes" size={16} /> Nueva Nota</button>
                                        </div>

                                        {/* Ficha técnica rápida */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                                            <div style={{ background: 'var(--bg-base)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Color</div>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedVehicle.color || '—'}</div>
                                            </div>
                                            <div style={{ background: 'var(--bg-base)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Dificultad</div>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>x{selectedVehicle.difficulty_factor || 1.0}</div>
                                            </div>
                                            <div style={{ background: 'var(--bg-base)', padding: 10, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Servicios</div>
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{vehicleHistory.length}</div>
                                            </div>
                                        </div>

                                        <SectionHeader icon="history" title="Historial de Servicio" />
                                        <div className="timeline">
                                            {vehicleHistory.length > 0 ? (
                                                vehicleHistory.map(h => (
                                                    <div key={h.id} className="timeline-item">
                                                        <div className="timeline-date">
                                                            {formatDate(h.date)} • {(h.km || 0).toLocaleString()} km
                                                            {h.source === 'OT' && <span style={{ marginLeft: 6, fontSize: 9, background: 'rgba(var(--primary-rgb), 0.15)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>OT #{h.order_number}</span>}
                                                            {h.source === 'NOTA' && <span style={{ marginLeft: 6, fontSize: 9, background: 'rgba(var(--warning-rgb, 245, 158, 11), 0.15)', color: 'var(--warning)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>NOTA</span>}
                                                        </div>
                                                        <div className="timeline-content">
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{h.description}</div>
                                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Técnico: {getMechanicName(h.technician)}</span>
                                                                {h.price > 0 && <strong style={{ color: 'var(--primary)' }}>{formatCurrency(h.price)}</strong>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                                    <Icon name="history_toggle_off" size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                                                    <p style={{ fontSize: 13 }}>Sin registros de servicio previos</p>
                                                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={handleOpenNewNote}>
                                                        <Icon name="add" size={14} /> Agregar primera nota
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </Fragment>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', minHeight: 200 }}>
                                        <Icon name="touch_app" size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                                        <p style={{ fontSize: 13 }}>Seleccioná un vehículo para ver<br />su ficha técnica e historial</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}

                {/* ==========================================
                    MODAL: NUEVO CLIENTE + VEHÍCULO
                ========================================== */}
                {showNewModal && (
                    <Modal title="Nuevo Cliente + Vehículo" onClose={() => setShowNewModal(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNewModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveNew} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Registro'}</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Información del Propietario</div>
                            <FormRow>
                                <FormField label="Nombre *"><input className="form-input" placeholder="Nombre" value={newClient.first_name} onChange={e => setNewClient({ ...newClient, first_name: e.target.value })} /></FormField>
                                <FormField label="Apellido *"><input className="form-input" placeholder="Apellido" value={newClient.last_name} onChange={e => setNewClient({ ...newClient, last_name: e.target.value })} /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Teléfono"><input className="form-input" placeholder="11-XXXX-XXXX" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} /></FormField>
                                <FormField label="DNI"><input className="form-input" placeholder="DNI" value={newClient.dni} onChange={e => setNewClient({ ...newClient, dni: e.target.value })} /></FormField>
                            </FormRow>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Datos del Vehículo</div>
                            <FormRow>
                                <FormField label="Patente *"><input className="form-input" placeholder="AA 123 BB" value={newVehicle.license_plate} onChange={e => setNewVehicle({ ...newVehicle, license_plate: e.target.value })} /></FormField>
                                <FormField label="Marca"><input className="form-input" placeholder="Ej: VW, Toyota..." value={newVehicle.brand} onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })} /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Modelo"><input className="form-input" placeholder="Ej: Amarok, Corolla..." value={newVehicle.model} onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })} /></FormField>
                                <FormField label="Año"><input className="form-input" type="number" placeholder="2024" value={newVehicle.year} onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })} /></FormField>
                            </FormRow>
                        </div>
                    </Modal>
                )}

                {/* ==========================================
                    MODAL: EDITAR DATOS DEL CLIENTE
                ========================================== */}
                {showEditClient && (
                    <Modal title="Editar Cliente" onClose={() => setShowEditClient(false)} width="500px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowEditClient(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveEditClient} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <FormRow>
                                <FormField label="Nombre *"><input className="form-input" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} /></FormField>
                                <FormField label="Apellido *"><input className="form-input" value={editForm.last_name} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Teléfono"><input className="form-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></FormField>
                                <FormField label="DNI"><input className="form-input" value={editForm.dni} onChange={e => setEditForm({ ...editForm, dni: e.target.value })} /></FormField>
                            </FormRow>
                            <FormField label="Email"><input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></FormField>
                        </div>
                    </Modal>
                )}

                {/* ==========================================
                    MODAL: AGREGAR VEHÍCULO AL CLIENTE
                ========================================== */}
                {showAddVehicle && (
                    <Modal title={`Nuevo Vehículo — ${selectedClient.first_name} ${selectedClient.last_name}`} onClose={() => setShowAddVehicle(false)} width="500px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowAddVehicle(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveNewVehicle} disabled={saving}>{saving ? 'Guardando...' : 'Agregar Vehículo'}</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <FormRow>
                                <FormField label="Patente *"><input className="form-input" placeholder="AA 123 BB" value={addVehicleForm.license_plate} onChange={e => setAddVehicleForm({ ...addVehicleForm, license_plate: e.target.value })} /></FormField>
                                <FormField label="Marca *"><input className="form-input" placeholder="Ej: Toyota" value={addVehicleForm.brand} onChange={e => setAddVehicleForm({ ...addVehicleForm, brand: e.target.value })} /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Modelo *"><input className="form-input" placeholder="Ej: Corolla" value={addVehicleForm.model} onChange={e => setAddVehicleForm({ ...addVehicleForm, model: e.target.value })} /></FormField>
                                <FormField label="Año"><input className="form-input" type="number" placeholder="2024" value={addVehicleForm.year} onChange={e => setAddVehicleForm({ ...addVehicleForm, year: e.target.value })} /></FormField>
                            </FormRow>
                            <FormField label="Kilometraje actual"><input className="form-input" type="number" placeholder="Ej: 45000" value={addVehicleForm.km} onChange={e => setAddVehicleForm({ ...addVehicleForm, km: e.target.value })} /></FormField>
                        </div>
                    </Modal>
                )}

                {/* ==========================================
                    MODAL: NUEVA NOTA DE SERVICIO
                ========================================== */}
                {showNewNote && selectedVehicle && (
                    <Modal title={`Nueva Nota — ${selectedVehicle.license_plate}`} onClose={() => setShowNewNote(false)} width="500px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNewNote(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveNote} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Nota'}</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <FormField label="Descripción del trabajo / nota *">
                                <textarea className="form-textarea" placeholder="Ej: Cambio de aceite y filtro, revisión general..." rows={3} value={noteForm.description} onChange={e => setNoteForm({ ...noteForm, description: e.target.value })} />
                            </FormField>
                            <FormRow>
                                <FormField label="Km al momento"><input className="form-input" type="number" placeholder="Ej: 45000" value={noteForm.km} onChange={e => setNoteForm({ ...noteForm, km: e.target.value })} /></FormField>
                                <FormField label="Costo ($)"><input className="form-input" type="number" placeholder="0" value={noteForm.cost} onChange={e => setNoteForm({ ...noteForm, cost: e.target.value })} /></FormField>
                            </FormRow>
                            <FormField label="Técnico / Mecánico"><input className="form-input" placeholder="Nombre del técnico (opcional)" value={noteForm.technician} onChange={e => setNoteForm({ ...noteForm, technician: e.target.value })} /></FormField>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};
