import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../data/data';
import {
    SectionHeader,
    DataTable,
    Modal,
    FormField,
    FormRow,
    Icon,
    EmptyState,
    StatusBadge,
    GlassCard
} from '../components/ui';

export const UsersPage = () => {
    const { employees: contextEmployees, refreshEmployees, user } = useAuth();
    const { timeTrackingLogs, deleteTimeLog, exportToExcel } = useApp();
    const [employees, setEmployees] = useState(contextEmployees);
    const [editingUser, setEditingUser] = useState(null);
    const [showNew, setShowNew] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', pin: '', role: 'mecanico', commission_rate: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewType, setViewType] = useState('accounts'); // 'accounts', 'attendance', 'performance'
    const [selectedEmployeeForStats, setSelectedEmployeeForStats] = useState(null);
    const [bonusPercent, setBonusPercent] = useState('0.3');
    const [periodFilter, setPeriodFilter] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const { getDetailedEmployeeStats } = useApp();

    useEffect(() => {
        const now = new Date();
        let start = new Date();
        
        if (periodFilter === 'today') {
            start.setHours(0, 0, 0, 0);
        } else if (periodFilter === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
        } else if (periodFilter === 'fortnight') {
            if (now.getDate() <= 15) {
                start.setDate(1);
            } else {
                start.setDate(16);
            }
            start.setHours(0, 0, 0, 0);
        } else if (periodFilter === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        }

        if (periodFilter !== 'custom' && periodFilter !== 'all') {
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(now.toISOString().split('T')[0]);
        } else if (periodFilter === 'all') {
            setStartDate('');
            setEndDate('');
        }
    }, [periodFilter]);

    useEffect(() => {
        const uniqueEmployees = contextEmployees.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setEmployees(uniqueEmployees);
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

    const handleDeleteLog = async (id) => {
        if (window.confirm('¿Confirmas que deseas eliminar este registro de asistencia? Esta acción no se puede deshacer.')) {
            try {
                await deleteTimeLog(id);
            } catch (e) {
                alert('No se pudo eliminar el registro: ' + e.message);
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
                    <button className={`nav-item ${viewType === 'accounts' ? 'active' : ''}`} onClick={() => setViewType('accounts')} style={{ padding: '12px 24px', border: 'none', background: 'none', borderBottom: viewType === 'accounts' ? '2px solid var(--primary)' : 'none', fontWeight: 600 }}>Cuentas de Acceso</button>
                    <button className={`nav-item ${viewType === 'attendance' ? 'active' : ''}`} onClick={() => setViewType('attendance')} style={{ padding: '12px 24px', border: 'none', background: 'none', borderBottom: viewType === 'attendance' ? '2px solid var(--primary)' : 'none', fontWeight: 600 }}>Reloj de Asistencia (General)</button>
                    <button className={`nav-item ${viewType === 'performance' ? 'active' : ''}`} onClick={() => setViewType('performance')} style={{ padding: '12px 24px', border: 'none', background: 'none', borderBottom: viewType === 'performance' ? '2px solid var(--primary)' : 'none', fontWeight: 600 }}>Historial Profesional (Detalle)</button>
                    {viewType === 'attendance' && (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 16 }}>
                            <button className="btn btn-ghost" onClick={() => exportToExcel('attendance')}>
                                <Icon name="download" size={18} /> Exportar Excel
                            </button>
                        </div>
                    )}
                </div>

                {viewType === 'accounts' && (
                    <DataTable
                        columns={[
                            { 
                                key: 'name', 
                                label: 'Nombre', 
                                render: r => (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ 
                                            width: 8, height: 8, borderRadius: '50%', 
                                            background: timeTrackingLogs.find(l => l.employee_id === r.id)?.type === 'IN' ? 'var(--success)' : 'var(--text-disabled)',
                                            boxShadow: timeTrackingLogs.find(l => l.employee_id === r.id)?.type === 'IN' ? '0 0 8px var(--success)' : 'none'
                                        }} />
                                        <strong>{r.name}</strong>
                                    </div>
                                )
                            },
                            { key: 'pin', label: 'PIN', render: r => <span style={{ fontFamily: 'monospace', letterSpacing: 2 }}>{r.pin}</span> },
                            {
                                key: 'role',
                                label: 'Rol',
                                render: r => (
                                    <StatusBadge
                                        status={r.role === 'admin' ? 'En Box' : 'Confirmado'}
                                        labelOverride={r.role === 'admin' ? 'ADMINISTRADOR' : r.role === 'cajero' ? 'CAJERO' : r.role === 'mecanico' ? 'MECÁNICO' : r.role === 'gomero' ? 'GOMERO' : r.role.toUpperCase()}
                                    />
                                )
                            },
                            {
                                key: 'status',
                                label: 'Última Actividad',
                                render: r => {
                                    const last = timeTrackingLogs.find(l => l.employee_id === r.id);
                                    if (!last) return <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>Sin registros</span>;
                                    return (
                                        <div style={{ fontSize: 11 }}>
                                            <span style={{ color: last.type === 'IN' ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{last.type === 'IN' ? 'ENTRADA' : 'SALIDA'}</span>
                                            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{new Date(last.timestamp).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    );
                                }
                            },
                            {
                                key: 'commission_rate',
                                label: 'Comisión (%)',
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
                )}

                {viewType === 'attendance' && (
                    <DataTable
                        columns={[
                            { 
                                key: 'date', 
                                label: 'Fecha/Hora', 
                                render: r => (
                                    <div style={{ fontSize: 13 }}>
                                        <div style={{ fontWeight: 600 }}>{new Date(r.timestamp).toLocaleDateString('es-AR')}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                )
                            },
                            { 
                                key: 'employee', 
                                label: 'Empleado', 
                                render: r => {
                                    const emp = employees.find(e => e.id === r.employee_id);
                                    return <strong>{emp?.name || 'Desconocido'}</strong>;
                                }
                            },
                            { 
                                key: 'event', 
                                label: 'Evento', 
                                render: r => (
                                    <StatusBadge 
                                        status={r.type === 'IN' ? 'En Box' : 'Cancelado'} 
                                        labelOverride={r.type === 'IN' ? 'ENTRADA' : 'SALIDA'} 
                                    />
                                )
                            },
                            {
                                key: 'actions',
                                label: '',
                                render: r => (
                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', opacity: 0.5 }} onClick={() => handleDeleteLog(r.id)} title="Borrar Registro">
                                            <Icon name="delete" size={16} />
                                        </button>
                                        <button className="btn btn-ghost btn-sm" style={{ opacity: 0.2 }} title="Auditoría">
                                            <Icon name="verified_user" size={16} />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                        data={[...timeTrackingLogs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))}
                    />
                )}

                {viewType === 'performance' && (
                    <React.Fragment>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(var(--primary-rgb), 0.05)', padding: 16, borderRadius: 12 }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <Icon name="search" size={20} style={{ color: 'var(--primary)' }} />
                                <select 
                                    className="form-select" 
                                    style={{ flex: 1, maxWidth: 300 }}
                                    onChange={(e) => setSelectedEmployeeForStats(employees.find(emp => emp.id === e.target.value))}
                                    value={selectedEmployeeForStats?.id || ''}
                                >
                                    <option value="">Selecciona un empleado para ver su historial...</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                                </select>
                                
                                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
                                    {[
                                        { id: 'today', label: 'Hoy' },
                                        { id: 'week', label: 'Semana' },
                                        { id: 'fortnight', label: 'Quincena' },
                                        { id: 'month', label: 'Mes' },
                                        { id: 'all', label: 'Todo' },
                                        { id: 'custom', label: 'Manual' }
                                    ].map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => setPeriodFilter(p.id)}
                                            style={{ 
                                                padding: '4px 10px', fontSize: 11, border: 'none', borderRadius: 4, cursor: 'pointer',
                                                background: periodFilter === p.id ? 'var(--primary)' : 'transparent',
                                                color: periodFilter === p.id ? 'white' : 'var(--text-primary)',
                                                fontWeight: periodFilter === p.id ? 700 : 500
                                            }}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                {periodFilter === 'custom' && (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input type="date" className="form-input" style={{ width: 130, padding: '4px 8px' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                                        <span style={{ fontSize: 12 }}>a</span>
                                        <input type="date" className="form-input" style={{ width: 130, padding: '4px 8px' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            {selectedEmployeeForStats && (
                                <div style={{ display: 'flex', gap: 16, borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                                    <div style={{ flex: 1, display: 'flex', gap: 20 }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Mano de Obra (Neto)</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>
                                                {formatCurrency(getDetailedEmployeeStats(selectedEmployeeForStats.id, { startDate, endDate }).totalProductionAmount)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(var(--success-rgb), 0.1)', padding: '6px 16px', borderRadius: 12, border: '1px solid rgba(var(--success-rgb), 0.2)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--success)', fontWeight: 700, letterSpacing: 0.5 }}>Ganancia Extra:</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <input 
                                                        type="number" 
                                                        step="0.05" 
                                                        style={{ width: 45, background: 'none', border: 'none', color: 'var(--success)', fontWeight: 'bold', fontSize: 16, textAlign: 'right', borderBottom: '1.5px dashed var(--success)', outline: 'none' }}
                                                        value={bonusPercent}
                                                        onChange={(e) => setBonusPercent(e.target.value)}
                                                    />
                                                    <span style={{ fontSize: 16, fontWeight: 'bold', color: 'var(--success)' }}>%</span>
                                                </div>
                                            </div>
                                            <div style={{ width: 1, height: 24, background: 'rgba(var(--success-rgb), 0.3)' }}></div>
                                            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--success)' }}>
                                                {formatCurrency(getDetailedEmployeeStats(selectedEmployeeForStats.id, { startDate, endDate }).totalProductionAmount * (parseFloat(bonusPercent) || 0) / 100)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Horas Totales</div>
                                            <div style={{ fontSize: 20, fontWeight: 800 }}>
                                                {parseFloat(getDetailedEmployeeStats(selectedEmployeeForStats.id, { startDate, endDate }).totalHours || 0).toFixed(2)}h
                                            </div>
                                        </div>
                                    </div>
                                    <button className="btn btn-ghost" onClick={() => exportToExcel('performance', { startDate, endDate })} style={{ alignSelf: 'center' }}>
                                        <Icon name="download" size={18} /> Planilla Pago
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedEmployeeForStats ? (
                            <div className="page-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                                <GlassCard title="Producción y Servicios">
                                    <DataTable
                                        columns={[
                                            { key: 'date', label: 'Fecha/Hora', render: r => <span style={{ fontSize: 11 }}>{new Date(r.date).toLocaleString('es-AR')}</span> },
                                            { key: 'type', label: 'Tipo', render: r => <span className="badge badge-active" style={{ fontSize: 9 }}>{r.type}</span> },
                                            { key: 'desc', label: 'Servicio', render: r => (
                                                <div style={{ fontSize: 11 }}>
                                                    {r.description} {r.order_number && <strong>#{r.order_number}</strong>}
                                                    {r.isShared && <span style={{ color: 'var(--primary)', fontSize: 10, marginLeft: 6, fontWeight: 700 }}>[COMPARTIDO]</span>}
                                                </div>
                                            ) },
                                            { key: 'amount', label: 'M.O.', render: r => <span style={{ fontWeight: 700 }}>{formatCurrency(r.amount)}</span> }
                                        ]}
                                        data={getDetailedEmployeeStats(selectedEmployeeForStats.id, { startDate, endDate }).productionList}
                                    />
                                </GlassCard>
                                <GlassCard title="Fichaje Individual">
                                    <DataTable
                                        columns={[
                                            { key: 'date', label: 'Fecha', render: r => new Date(r.timestamp).toLocaleDateString('es-AR') },
                                            { key: 'time', label: 'Hora', render: r => new Date(r.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) },
                                            { key: 'type', label: 'Evento', render: r => (
                                                <span style={{ fontSize: 10, fontWeight: 700, color: r.type === 'IN' ? 'var(--success)' : 'var(--danger)' }}>
                                                    {r.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                                                </span>
                                            )},
                                            {
                                                key: 'actions',
                                                label: '',
                                                render: r => (
                                                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: 0 }} onClick={() => handleDeleteLog(r.id)}>
                                                        <Icon name="delete" size={14} />
                                                    </button>
                                                )
                                            }
                                        ]}
                                        data={getDetailedEmployeeStats(selectedEmployeeForStats.id, { startDate, endDate }).attendanceLogs}
                                    />
                                </GlassCard>
                            </div>
                        ) : (
                            <div style={{ marginTop: 20 }}>
                                <EmptyState 
                                    icon="person_search" 
                                    title="No hay empleado seleccionado" 
                                    description="Seleccioná un miembro del equipo para auditar su rendimiento, horas trabajadas y trabajos realizados."
                                />
                            </div>
                        )}
                    </React.Fragment>
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
                                        <option value="limpieza">Limpieza (Solo Fichaje)</option>
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
