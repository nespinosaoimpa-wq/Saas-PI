import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
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
    const { employees: contextEmployees, refreshEmployees, user } = useAuth();
    const { timeTrackingLogs } = useApp();
    const [employees, setEmployees] = useState(contextEmployees);
    const [showLogs, setShowLogs] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', pin: '', role: 'mecanico', commission_rate: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setEmployees(contextEmployees);
    }, [contextEmployees]);

    const handleSave = async () => {
        if (!newUser.name || !newUser.pin) {
            setError('El nombre y el PIN son obligatorios');
            return;
        }
        if (newUser.pin.length !== 4) {
            setError('El PIN debe tener exactamente 4 dígitos');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (editingUser) {
                const { error: updateError } = await supabase
                    .from('employees')
                    .update({
                        name: newUser.name,
                        role: newUser.role,
                        pin: newUser.pin,
                        commission_rate: newUser.commission_rate
                    })
                    .eq('id', editingUser.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('employees')
                    .insert([{
                        name: newUser.name,
                        role: newUser.role,
                        pin: newUser.pin,
                        commission_rate: newUser.commission_rate
                    }]);

                if (insertError) throw insertError;
            }

            await refreshEmployees();
            setShowNew(false);
            setEditingUser(null);
        } catch (err) {
            console.error('Error guardando empleado:', err);
            setError(err.message || 'Error al guardar el empleado');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (emp) => {
        setEditingUser(emp);
        setNewUser({ name: emp.name, pin: emp.pin, role: emp.role, commission_rate: emp.commission_rate });
        setShowNew(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas desactivar este usuario? Ya no podrá ingresar pero su historial se mantendrá.')) {
            try {
                await supabase.from('employees').update({ is_active: false }).eq('id', id);
                await refreshEmployees();
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (user.role !== 'admin') {
        return <div style={{ padding: 40, textAlign: 'center' }}>Acceso Denegado. Solo administradores.</div>;
    }

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0 }}>Gestión de Personal</h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Crea perfiles con PIN y define roles y comisiones según corresponda.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => {
                        setEditingUser(null);
                        setNewUser({ name: '', pin: '', role: 'mecanico', commission_rate: 0 });
                        setShowNew(true);
                        setError('');
                    }}>
                        <Icon name="person_add" size={18} /> Nuevo Empleado
                    </button>
                </div>

                <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
                    <button className={`nav-item ${!showLogs ? 'active' : ''}`} onClick={() => setShowLogs(false)} style={{ padding: '12px 24px', border: 'none', background: 'none', borderBottom: !showLogs ? '2px solid var(--primary)' : 'none', fontWeight: 600 }}>Cuentas de Acceso</button>
                    <button className={`nav-item ${showLogs ? 'active' : ''}`} onClick={() => setShowLogs(true)} style={{ padding: '12px 24px', border: 'none', background: 'none', borderBottom: showLogs ? '2px solid var(--primary)' : 'none', fontWeight: 600 }}>Reloj de Asistencia</button>
                </div>

                {!showLogs ? (
                    <DataTable
                        columns={[
                            { key: 'name', label: 'Nombre', render: r => <strong>{r.name}</strong> },
                            { key: 'pin', label: 'PIN', render: r => <span style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{r.pin}</span> },
                            {
                                key: 'role',
                                label: 'Rol',
                                render: r => (
                                    <StatusBadge
                                        status={r.role === 'admin' ? 'En Box' : r.role === 'mecanico' ? 'Pendiente' : 'Finalizado'}
                                        labelOverride={r.role.toUpperCase()}
                                    />
                                )
                            },
                            {
                                key: 'commission_rate',
                                label: 'Comisión Base (%)',
                                render: r => <span>{parseFloat(r.commission_rate).toFixed(1)}%</span>
                            },
                            {
                                key: 'actions',
                                label: '',
                                render: r => (
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(r)}>
                                            <Icon name="edit" size={16} />
                                        </button>
                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(r.id)}>
                                            <Icon name="delete" size={16} />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                        data={employees}
                    />
                ) : (
                    <DataTable
                        columns={[
                            { key: 'employee_name', label: 'Empleado', render: r => <strong>{r.employee_name}</strong> },
                            { key: 'type', label: 'Evento', render: r => (
                                <span style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: 12, 
                                    fontSize: 11, 
                                    fontWeight: 700,
                                    background: r.type === 'IN' ? 'rgba(var(--success-rgb), 0.1)' : 'rgba(var(--danger-rgb), 0.1)',
                                    color: r.type === 'IN' ? 'var(--success)' : 'var(--danger)'
                                }}>
                                    {r.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                </span>
                            )},
                            { key: 'timestamp', label: 'Fecha y Hora', render: r => new Date(r.timestamp).toLocaleString('es-AR') }
                        ]}
                        data={timeTrackingLogs.slice(0, 50)}
                    />
                )}

                {showNew && (
                    <Modal
                        title={editingUser ? "Editar Empleado" : "Nuevo Empleado"}
                        onClose={() => { setShowNew(false); setEditingUser(null); }}
                        footer={
                            <React.Fragment>
                                <button className="btn btn-ghost" onClick={() => { setShowNew(false); setEditingUser(null); }} disabled={loading}>Cancelar</button>
                                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar Empleado'}
                                </button>
                            </React.Fragment>
                        }
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {error && <div style={{ color: 'var(--danger)', fontSize: 13, background: 'rgba(var(--danger-rgb), 0.1)', padding: 12, borderRadius: 4 }}>{error}</div>}

                            <FormField label="Nombre o Alias">
                                <input className="form-input" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Ej: Pablo" />
                            </FormField>

                            <FormRow>
                                <FormField label="Rol del Sistema">
                                    <select className="form-select" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                        <option value="admin">Administrador (Control Total)</option>
                                        <option value="cajero">Cajero (Cobros y Ventas)</option>
                                        <option value="mecanico">Mecánico (Mecánica Grl y Box)</option>
                                        <option value="gomero">Gomero (Gomería Express)</option>
                                    </select>
                                </FormField>
                                <FormField label="PIN de Acceso Rápido (4 dígitos)">
                                    <input type="text" maxLength={4} className="form-input" value={newUser.pin} onChange={e => setNewUser({ ...newUser, pin: e.target.value.replace(/\D/g, '') })} placeholder="1234" style={{ letterSpacing: 4, fontFamily: 'monospace' }} />
                                </FormField>
                            </FormRow>

                            {(newUser.role === 'mecanico' || newUser.role === 'gomero') && (
                                <FormField label="Porcentaje de Comisión Base (%) sobre Mano de Obra">
                                    <input type="number" step="0.1" className="form-input" value={newUser.commission_rate} onChange={e => setNewUser({ ...newUser, commission_rate: parseFloat(e.target.value) || 0 })} placeholder="Ej: 15.5" />
                                </FormField>
                            )}

                            <div style={{ padding: 12, background: 'rgba(var(--primary-rgb), 0.1)', border: '1px solid rgba(var(--primary-rgb), 0.3)', borderRadius: 'var(--radius)', marginTop: 8 }}>
                                <div style={{ fontSize: 12, display: 'flex', gap: 8, color: 'var(--text-primary)' }}>
                                    <Icon name="info" size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                    <span>La comisión base se aplica por defecto en las Órdenes de Trabajo de este empleado, pero puedes modificarla puntualmente en cada Orden.</span>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};
