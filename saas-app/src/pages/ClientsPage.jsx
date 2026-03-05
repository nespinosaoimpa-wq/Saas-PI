import React, { useState, Fragment } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import {
    SearchBar,
    DataTable,
    Modal,
    SectionHeader,
    HealthRing,
    FormRow,
    FormField,
    Icon,
    CameraScanner
} from '../components/ui';

export const ClientsPage = ({ initialScannedCode = '' }) => {
    const { data: MOCK, getClientVehicles, addClient, addVehicle, updateClient, addVehicleNote, getVehicleHistory } = useApp();
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    const [newClient, setNewClient] = useState({ first_name: '', last_name: '', phone: '', dni: '', email: '' });
    const [newVehicle, setNewVehicle] = useState({ license_plate: initialScannedCode, brand: '', model: '', year: '' });
    const [noteData, setNoteData] = useState({ description: '', km: '', cost: '', technician: '' });

    React.useEffect(() => {
        if (initialScannedCode) {
            handleScanResult(initialScannedCode);
        }
    }, [initialScannedCode]);

    const handleScanResult = (code) => {
        const vehicle = (MOCK.vehicles || []).find(v => (v.license_plate || '').toUpperCase() === code.toUpperCase());
        if (vehicle) {
            const client = MOCK.clients.find(c => c.id === vehicle.client_id);
            if (client) {
                setSelectedClient(client);
                setSelectedVehicle(vehicle);
            }
        } else {
            setNewVehicle(prev => ({ ...prev, license_plate: code }));
            setShowNewModal(true);
        }
        setShowCamera(false);
    };

    const handleSaveNew = async () => {
        if (!newClient.first_name || !newClient.last_name || !newVehicle.license_plate) {
            alert('Por favor completá los campos obligatorios (Nombre, Apellido y Patente).');
            return;
        }
        try {
            const createdClient = await addClient({ ...newClient, is_frequent: false });
            await addVehicle({ ...newVehicle, client_id: createdClient.id, km: 0, difficulty_factor: 1.0, color: 'N/A' });
            alert('✅ Cliente y vehículo registrados con éxito.');
            setShowNewModal(false);
            setNewClient({ first_name: '', last_name: '', phone: '', dni: '', email: '' });
            setNewVehicle({ license_plate: '', brand: '', model: '', year: '' });
        } catch (e) {
            alert('Error al registrar el cliente: ' + e.message);
        }
    };

    const handleSaveEditClient = async () => {
        if (!newClient.first_name || !newClient.last_name) return alert('Nombre y Apellido son obligatorios.');
        try {
            await updateClient(selectedClient.id, newClient);
            alert('✅ Cliente actualizado con éxito.');
            setSelectedClient({ ...selectedClient, ...newClient });
            setShowEditModal(false);
        } catch (e) {
            alert('Error al actualizar: ' + e.message);
        }
    };

    const handleSaveNote = async () => {
        if (!noteData.description) return alert('La descripción es obligatoria.');
        try {
            await addVehicleNote({
                vehicle_id: selectedVehicle.id,
                ...noteData
            });
            alert('✅ Nota agregada con éxito.');
            setShowNoteModal(false);
            setNoteData({ description: '', km: '', cost: '', technician: '' });
        } catch (e) {
            alert('Error al agregar nota: ' + e.message);
        }
    };

    const getWhatsAppUrl = (phone, text = '') => {
        if (!phone) return '#';
        let clean = phone.toString().replace(/\D/g, '');
        if (clean.length === 10) clean = '549' + clean;
        return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
    };

    const filtered = (MOCK?.clients || []).filter(c => {
        if (!c) return false;
        const searchStr = `${c.first_name || ''} ${c.last_name || ''} ${c.phone || ''} ${c.dni || ''}`.toLowerCase();
        return searchStr.includes((search || '').toLowerCase());
    });

    const handleSelectClient = (client) => {
        setSelectedClient(client);
        setSelectedVehicle(null);
    };

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 250 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar cliente por nombre, teléfono o DNI..." /></div>
                    <button className="btn btn-ghost" onClick={() => setShowCamera(true)}>
                        <Icon name="photo_camera" size={20} /> Escanear Patente
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowNewModal(true)}><Icon name="person_add" size={18} /> Nuevo Cliente</button>
                </div>

                <DataTable
                    columns={[
                        { key: 'name', label: 'Cliente', render: r => <div><strong>{r?.first_name || 'Sin Nombre'} {r?.last_name || ''}</strong>{r?.is_frequent && <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--success)', fontWeight: 700 }}>★ FRECUENTE</span>}</div> },
                        { key: 'phone', label: 'Teléfono', render: r => r?.phone || '-' },
                        { key: 'dni', label: 'DNI', render: r => r?.dni || '-' },
                        { key: 'vehicles', label: 'Vehículos', render: r => <span className="nav-badge" style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)' }}>{r ? (getClientVehicles(r.id) || []).length : 0}</span> },
                        { key: 'actions', label: '', render: r => <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); if (r) handleSelectClient(r); }}>Ver Ficha</button> },
                    ]}
                    data={filtered}
                    onRowClick={r => handleSelectClient(r)}
                />

                {selectedClient && (
                    <Modal
                        title={`Ficha: ${selectedClient?.first_name || 'Sin Nombre'} ${selectedClient?.last_name || ''}`}
                        onClose={() => setSelectedClient(null)}
                        width="900px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setSelectedClient(null)}>Cerrar</button><button className="btn btn-primary" onClick={() => { setNewClient({ ...selectedClient }); setShowEditModal(true); }}>Editar Datos</button></Fragment>}
                    >
                        <div className="grid-client-detail">
                            {/* Profile + Vehicles */}
                            <div>
                                <div style={{ background: 'var(--bg-base)', padding: 18, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 20 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.5px' }}>Datos Personales</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <strong style={{ color: 'var(--text-primary)' }}>Tel:</strong> {selectedClient?.phone || '-'}
                                            {selectedClient?.phone && (
                                                <a href={getWhatsAppUrl(selectedClient.phone, `Hola ${selectedClient.first_name || ''}, nos comunicamos de PIRIPI PRO...`)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: '#25D366' }}>
                                                    <Icon name="whatshot" size={16} /> WhatsApp
                                                </a>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {selectedClient?.email || '-'}</div>
                                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>DNI:</strong> {selectedClient?.dni || '-'}</div>
                                        <div style={{ marginTop: 8 }}>
                                            {selectedClient?.is_frequent ? <span className="badge badge-done">Cliente Frecuente</span> : <span className="badge badge-pending">Cliente Normal</span>}
                                        </div>
                                    </div>
                                </div>

                                <SectionHeader icon="directions_car" title="Vehículos" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {(getClientVehicles(selectedClient?.id) || []).map(v => (
                                        <div
                                            key={v?.id}
                                            className="glass-card"
                                            style={{
                                                padding: 14, cursor: 'pointer',
                                                borderLeft: selectedVehicle?.id === v?.id ? '3px solid var(--primary)' : undefined,
                                                background: selectedVehicle?.id === v?.id ? 'rgba(var(--primary-rgb), 0.05)' : undefined
                                            }}
                                            onClick={() => setSelectedVehicle(v)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontSize: 13, fontWeight: 700 }}>{v?.brand} {v?.model}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v?.license_plate} • {(v?.km || 0).toLocaleString()} km</div>
                                                </div>
                                                <HealthRing score={v?.health_score || 0} size={38} />
                                            </div>
                                        </div>
                                    ))}
                                    <button className="btn btn-ghost btn-sm" style={{ borderStyle: 'dashed', justifyContent: 'center' }}>
                                        <Icon name="add" size={16} /> Agregar Vehículo
                                    </button>
                                </div>
                            </div>

                            {/* History Panel */}
                            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
                                {selectedVehicle ? (
                                    <Fragment>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                            <div>
                                                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px 0' }}>Historial: {selectedVehicle.license_plate}</h3>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {selectedVehicle.id}</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                {/* QR Code generator pointing to public history */}
                                                <div style={{ background: 'white', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(window.location.origin + '?vehicle_id=' + selectedVehicle.id)}`}
                                                        alt="QR Historial"
                                                        width={60} height={60}
                                                    />
                                                </div>
                                                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'stretch' }} onClick={() => setShowNoteModal(true)}><Icon name="add_notes" size={16} /> Nueva Nota</button>
                                            </div>
                                        </div>

                                        <div className="timeline">
                                            {getVehicleHistory(selectedVehicle.id).length > 0 ? (
                                                getVehicleHistory(selectedVehicle.id).map(h => (
                                                    <div key={h.id} className="timeline-item">
                                                        <div className="timeline-date">{h.date} • {(h.km || 0).toLocaleString()} km</div>
                                                        <div className="timeline-content">
                                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{h.description}</div>
                                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                                                <span>Técnico: {h.technician}</span>
                                                                <strong style={{ color: 'var(--primary)' }}>{formatCurrency(h.price)}</strong>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                                    <Icon name="history_toggle_off" size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                                                    <p style={{ fontSize: 13 }}>Sin registros de servicio previos</p>
                                                </div>
                                            )}
                                        </div>
                                    </Fragment>
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', minHeight: 200 }}>
                                        <Icon name="touch_app" size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                                        <p style={{ fontSize: 13 }}>Seleccioná un vehículo para ver<br />su historial detallado</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}

                {showNewModal && (
                    <Modal title="Nuevo Cliente + Vehículo" onClose={() => setShowNewModal(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNewModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveNew}>Guardar Registro</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Información del Propietario</div>
                            <FormRow>
                                <FormField label="Nombre"><input className="form-input" placeholder="Nombre" value={newClient.first_name} onChange={e => setNewClient({ ...newClient, first_name: e.target.value })} /></FormField>
                                <FormField label="Apellido"><input className="form-input" placeholder="Apellido" value={newClient.last_name} onChange={e => setNewClient({ ...newClient, last_name: e.target.value })} /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Teléfono"><input className="form-input" placeholder="11-XXXX-XXXX" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} /></FormField>
                                <FormField label="DNI"><input className="form-input" placeholder="DNI" value={newClient.dni} onChange={e => setNewClient({ ...newClient, dni: e.target.value })} /></FormField>
                            </FormRow>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Datos del Vehículo</div>
                            <FormRow>
                                <FormField label="Patente"><input className="form-input" placeholder="AA 123 BB" value={newVehicle.license_plate} onChange={e => setNewVehicle({ ...newVehicle, license_plate: e.target.value })} /></FormField>
                                <FormField label="Marca"><input className="form-input" placeholder="Ej: VW, Toyota..." value={newVehicle.brand} onChange={e => setNewVehicle({ ...newVehicle, brand: e.target.value })} /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Modelo"><input className="form-input" placeholder="Ej: Amarok, Corolla..." value={newVehicle.model} onChange={e => setNewVehicle({ ...newVehicle, model: e.target.value })} /></FormField>
                                <FormField label="Año"><input className="form-input" type="number" placeholder="2024" value={newVehicle.year} onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })} /></FormField>
                            </FormRow>
                        </div>
                    </Modal>
                )}
            </div>

            {showCamera && (
                <CameraScanner onScan={handleScanResult} onClose={() => setShowCamera(false)} defaultMode="plate" />
            )}

            {showEditModal && (
                <Modal title="Editar Datos del Cliente" onClose={() => setShowEditModal(false)}
                    footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowEditModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveEditClient}>Guardar Cambios</button></Fragment>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <FormRow>
                            <FormField label="Nombre"><input className="form-input" value={newClient.first_name} onChange={e => setNewClient({ ...newClient, first_name: e.target.value })} /></FormField>
                            <FormField label="Apellido"><input className="form-input" value={newClient.last_name} onChange={e => setNewClient({ ...newClient, last_name: e.target.value })} /></FormField>
                        </FormRow>
                        <FormRow>
                            <FormField label="Teléfono"><input className="form-input" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} /></FormField>
                            <FormField label="Email"><input className="form-input" value={newClient.email || ''} onChange={e => setNewClient({ ...newClient, email: e.target.value })} /></FormField>
                        </FormRow>
                        <FormField label="DNI"><input className="form-input" value={newClient.dni} onChange={e => setNewClient({ ...newClient, dni: e.target.value })} /></FormField>
                    </div>
                </Modal>
            )}

            {showNoteModal && (
                <Modal title="Agregar Nota / Recordatorio" onClose={() => setShowNoteModal(false)}
                    footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNoteModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSaveNote}>Guardar Nota</button></Fragment>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <FormField label="Descripción de la Nota *">
                            <textarea className="form-input" style={{ minHeight: 100 }} placeholder="Ej: Cambio de aceite recomendado en 5000km..." value={noteData.description} onChange={e => setNoteData({ ...noteData, description: e.target.value })} />
                        </FormField>
                        <FormRow>
                            <FormField label="Kilometraje (opcional)"><input className="form-input" type="number" value={noteData.km} onChange={e => setNoteData({ ...noteData, km: e.target.value })} /></FormField>
                            <FormField label="Costo (si aplica)"><input className="form-input" type="number" value={noteData.cost} onChange={e => setNoteData({ ...noteData, cost: e.target.value })} /></FormField>
                        </FormRow>
                        <FormField label="Técnico / Responsable"><input className="form-input" value={noteData.technician} onChange={e => setNoteData({ ...noteData, technician: e.target.value })} /></FormField>
                    </div>
                </Modal>
            )}
        </div>
    );
};
