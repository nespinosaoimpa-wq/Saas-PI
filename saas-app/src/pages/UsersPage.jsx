import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
    SectionHeader,
    DataTable,
    Modal,
    FormField,
    FormRow,
    Icon,
    EmptyState,
    StatusBadge
} from '../components/ui';

export const UsersPage = () => {
    // Para simplificar, usamos MOCK.users si existe, sino un fallback
    const { data: MOCK } = useApp();
    const users = MOCK.users || [
        { id: '1', name: 'Nico Admin', email: 'nico@piripi.com', role: 'admin', status: 'Activo' },
        { id: '2', name: 'Juan Mecánico', email: 'juan@piripi.com', role: 'mecanico', status: 'Activo' },
        { id: '3', name: 'María Caja', email: 'maria@piripi.com', role: 'cajero', status: 'Inactivo' }
    ];

    const [showNew, setShowNew] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'mecanico', password: '' });

    const handleSave = () => {
        alert('Funcionalidad de guardado de usuarios (requiere Supabase Auth). Simulando guardado exitoso.');
        setShowNew(false);
        setEditingUser(null);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setNewUser({ ...user, password: '' });
        setShowNew(true);
    };

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0 }}>Gestión de Personal</h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Maneja los accesos y permisos de tu equipo.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowNew(true)}>
                        <Icon name="person_add" size={18} /> Nuevo Usuario
                    </button>
                </div>

                <DataTable
                    columns={[
                        { key: 'name', label: 'Nombre', render: r => <strong>{r.name}</strong> },
                        { key: 'email', label: 'Email' },
                        {
                            key: 'role',
                            label: 'Rol',
                            render: r => (
                                <StatusBadge
                                    status={r.role === 'admin' ? 'Finalizado' : r.role === 'mecanico' ? 'En Box' : 'Pendiente'}
                                    labelOverride={r.role.toUpperCase()}
                                />
                            )
                        },
                        {
                            key: 'status',
                            label: 'Estado',
                            render: r => <span style={{ color: r.status === 'Activo' ? 'var(--success)' : 'var(--text-muted)' }}>{r.status}</span>
                        },
                        {
                            key: 'actions',
                            label: '',
                            render: r => (
                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(r)}>
                                    <Icon name="edit" size={16} />
                                </button>
                            )
                        }
                    ]}
                    data={users}
                />

                {showNew && (
                    <Modal
                        title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                        onClose={() => { setShowNew(false); setEditingUser(null); }}
                        footer={
                            <React.Fragment>
                                <button className="btn btn-ghost" onClick={() => { setShowNew(false); setEditingUser(null); }}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSave}>Guardar Acceso</button>
                            </React.Fragment>
                        }
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Nombre Completo">
                                <input className="form-input" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Ej: Juan Pérez" />
                            </FormField>
                            <FormField label="Correo Electrónico (Login)">
                                <input type="email" className="form-input" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="usuario@empresa.com" />
                            </FormField>
                            <FormRow>
                                <FormField label="Rol de Acceso">
                                    <select className="form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                        <option value="admin">Administrador (Acceso Total)</option>
                                        <option value="mecanico">Mecánico (Solo OTs y Diario)</option>
                                        <option value="cajero">Cajero (Solo Pagos e Inventario)</option>
                                    </select>
                                </FormField>
                                <FormField label="Contraseña">
                                    <input type="password" className="form-input" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder={editingUser ? "(Dejar en blanco para no cambiar)" : "Mínimo 6 caracteres"} />
                                </FormField>
                            </FormRow>

                            <div style={{ padding: 12, background: 'rgba(var(--warning-rgb), 0.1)', border: '1px solid rgba(var(--warning-rgb), 0.3)', borderRadius: 'var(--radius)', marginTop: 8 }}>
                                <div style={{ fontSize: 12, display: 'flex', gap: 8, color: 'var(--text-primary)' }}>
                                    <Icon name="info" size={16} style={{ color: 'var(--warning)' }} />
                                    <span>Al guardar, este usuario podrá iniciar sesión con su correo y contraseña apuntando a la base de datos de Supabase.</span>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};
