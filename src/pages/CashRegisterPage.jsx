import React, { useState, Fragment } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
    Tabs,
    StatCard,
    DataTable,
    Modal,
    FormField,
    FormRow,
    StatusBadge,
    SectionHeader,
    Icon,
    PrintableClosing
} from '../components/ui';

export const CashRegisterPage = () => {
    const { data: MOCK, addPayment, updatePayment, deletePayment, performCashClose, addWithdrawal, getCommissions, exportToExcel } = useApp();
    const { user, employees } = useAuth();
    const [period, setPeriod] = useState('daily');
    const [showNew, setShowNew] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [showClose, setShowClose] = useState(false);
    const [lastClosing, setLastClosing] = useState(null);
    const [closingCash, setClosingCash] = useState('');
    const [newPayment, setNewPayment] = useState({ amount: '', method: 'EFECTIVO', reference: '', work_order_id: '', description: '' });
    const [newWithdrawal, setNewWithdrawal] = useState({ amount: '', description: '' });

    // For editing payments
    const [showEdit, setShowEdit] = useState(false);
    const [editingPayment, setEditingPayment] = useState({ id: '', amount: '', method: 'EFECTIVO', description: '', reference: '' });

    const isAdmin = user?.role === 'admin';

    const technicians = employees.filter(e => e.role === 'mecanico' || e.role === 'gomero');

    const handleRegisterPayment = () => {
        if (!newPayment.amount || isNaN(newPayment.amount)) {
            alert('Ingresá un monto válido');
            return;
        }
        addPayment({
            ...newPayment,
            amount: parseFloat(newPayment.amount),
            employee_id: user?.id
        });
        setShowNew(false);
        setNewPayment({ amount: '', method: 'EFECTIVO', reference: '', work_order_id: '', description: '' });
    };

    const handleRegisterWithdrawal = () => {
        if (!newWithdrawal.amount || isNaN(newWithdrawal.amount)) {
            alert('Ingresá un monto válido para el egreso');
            return;
        }
        addWithdrawal({
            amount: parseFloat(newWithdrawal.amount),
            description: newWithdrawal.description || 'Retiro de caja',
            employee_id: user?.id
        });
        setShowWithdrawal(false);
        setNewWithdrawal({ amount: '', description: '' });
    };

    const handleDeletePayment = async (id) => {
        if (window.confirm('¿Seguro que querés eliminar este registro? Esta acción es solo para correcciones y no se puede deshacer.')) {
            try {
                await deletePayment(id);
            } catch (error) {
                alert('Error al eliminar: ' + error.message);
            }
        }
    };

    const handlePerformClose = async () => {
        const cash_expected = cash;
        const diff = parseFloat(closingCash || 0) - cash_expected;
        const res = await performCashClose({
            cash_expected,
            cash_real: parseFloat(closingCash || 0),
            difference: diff,
            transfer_total: transfer,
            card_total: card,
            total_day: cash + transfer + card,
            employee_id: user.id
        });
        setLastClosing({ ...res, employee_name: user.name });
        setShowClose(false);
        setClosingCash('');
    };

    const handleEditPaymentSubmit = async () => {
        if (!editingPayment.amount || isNaN(editingPayment.amount)) {
            alert('Ingresá un monto válido');
            return;
        }
        await updatePayment(editingPayment.id, {
            amount: parseFloat(editingPayment.amount),
            method: editingPayment.method,
            description: editingPayment.description,
            reference: editingPayment.reference || null
        });
        setShowEdit(false);
        setEditingPayment({ id: '', amount: '', method: 'EFECTIVO', description: '', reference: '' });
    };



    const handleOpenEdit = (payment) => {
        setEditingPayment({
            id: payment.id,
            amount: payment.amount,
            method: payment.method || payment.payment_method || 'EFECTIVO',
            description: payment.description || '',
            reference: payment.reference || ''
        });
        setShowEdit(true);
    };

    const todayStr = new Date().toISOString().split('T')[0];

    // Only show UNCLOSED payments for the current shift (no cash_closing_id). We don't filter by date anymore, 
    // to catch payments from shifts spanning midnight or forgotten closures.
    const todayPayments = MOCK.payments.filter(p => !p.cash_closing_id);

    const sortedClosings = (MOCK.cashClosings || []).sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
    const startingBalance = sortedClosings.length > 0 ? (sortedClosings[0].actual_cash || 0) : 0;

    // Cash balance sums positives and negatives correctly (withdrawals are saved as negative)
    const cash = todayPayments.filter(p => (p.method || p.payment_method) === 'EFECTIVO').reduce((s, p) => s + p.amount, 0);
    const transfer = todayPayments.filter(p => (p.method || p.payment_method) === 'TRANSFERENCIA').reduce((s, p) => s + p.amount, 0);
    const card = todayPayments.filter(p => (p.method || p.payment_method) === 'TARJETA').reduce((s, p) => s + p.amount, 0);

    const currentExpectedCash = cash + startingBalance;

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthStart = todayStr.slice(0, 7);
    // Daily: only unclosed (current shift). Weekly/Monthly: ALL payments for full reporting.
    const allPayments = period === 'daily' ? todayPayments
        : period === 'weekly' ? MOCK.payments.filter(p => (p.date || p.payment_date) >= weekAgo)
            : MOCK.payments.filter(p => (p.date || p.payment_date)?.startsWith(monthStart));

    const totalPeriod = allPayments.reduce((s, p) => s + p.amount, 0);

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs tabs={[{ key: 'daily', label: 'Diario' }, { key: 'weekly', label: 'Semanal' }, { key: 'monthly', label: 'Mensual' }]} active={period} onChange={setPeriod} />
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-ghost" onClick={() => exportToExcel('payments')}>
                        <Icon name="download" size={18} /> Exportar Excel
                    </button>
                    <button className="btn btn-ghost" onClick={() => setShowClose(true)}><Icon name="lock" size={18} /> Cierre de Caja</button>
                    <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setShowWithdrawal(true)}><Icon name="money_off" size={18} /> Retiro / Egreso</button>
                    <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="add" size={18} /> Registrar Ingreso</button>
                </div>

                <div className="grid-auto-cards">
                    <StatCard icon="payments" label={`Total ${period === 'daily' ? 'Turno' : period === 'weekly' ? 'Semana' : 'Mes'}`} value={formatCurrency(totalPeriod)} sub={`${allPayments.length} operaciones`} barPercent={75} />
                    <StatCard icon="account_balance_wallet" label="Caja Esperada" value={formatCurrency(period === 'daily' ? currentExpectedCash : cash)} sub={period === 'daily' ? `Saldo anterior: ${formatCurrency(startingBalance)}` : "Efectivo total"} barPercent={period === 'daily' ? (currentExpectedCash > 0 ? 100 : 0) : (cash > 0 ? 100 : 0)} barAlert />
                    <StatCard icon="swap_horiz" label="Transferencias" value={formatCurrency(transfer)} sub="Turno" barPercent={transfer > 0 ? 100 : 0} />
                    <StatCard icon="credit_card" label="Tarjeta" value={formatCurrency(card)} sub="Turno" barPercent={card > 0 ? 100 : 0} />
                </div>

                <DataTable
                    columns={[
                        { key: 'date', label: 'Fecha/Hora', render: r => r.created_at ? new Date(r.created_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : (r.date || r.payment_date) },
                        {
                            key: 'employee', label: 'Cajero', render: r => {
                                const emp = employees.find(e => e.id === r.employee_id);
                                return emp ? emp.name : '—';
                            }
                        },
                        {
                            key: 'type', label: 'Tipo', render: r => {
                                const t = r.type || (r.amount < 0 ? 'EGRESO' : 'INGRESO');
                                const typeColors = {
                                    'INGRESO': { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71', icon: 'arrow_downward', label: 'Ingreso' },
                                    'EGRESO': { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c', icon: 'arrow_upward', label: 'Egreso' },
                                    'VENTA': { bg: 'rgba(52,152,219,0.15)', color: '#3498db', icon: 'shopping_cart', label: 'Venta POS' },
                                };
                                const cfg = typeColors[t] || typeColors['INGRESO'];
                                return (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                                        <Icon name={cfg.icon} size={13} /> {cfg.label}
                                    </span>
                                );
                            }
                        },
                        {
                            key: 'amount', label: 'Monto', render: r => (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {r.amount < 0 && <Icon name="trending_down" size={14} style={{ color: 'var(--danger)' }} />}
                                    <strong style={{ color: r.amount < 0 ? 'var(--danger)' : 'var(--primary)' }}>{formatCurrency(r.amount)}</strong>
                                </div>
                            )
                        },
                        {
                            key: 'method', label: 'Método', render: r => {
                                const m = r.method || r.payment_method || 'EFECTIVO';
                                const methodMap = {
                                    'EFECTIVO': { label: '💵 Efectivo', color: '#27ae60' },
                                    'TRANSFERENCIA': { label: '📲 Transferencia', color: '#2980b9' },
                                    'TARJETA': { label: '💳 Tarjeta', color: '#8e44ad' },
                                };
                                const cfg = methodMap[m] || { label: m, color: 'var(--text-muted)' };
                                return (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: `${cfg.color}22`, color: cfg.color }}>
                                        {cfg.label}
                                    </span>
                                );
                            }
                        },
                        { key: 'reference', label: 'Referencia', render: r => r.reference || '—' },
                        { key: 'desc', label: 'Descripción', render: r => <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.description}</span> },
                        {
                            key: 'actions',
                            label: '',
                            render: r => isAdmin && (
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(r)} style={{ color: 'var(--text)' }}>
                                        <Icon name="edit" size={14} />
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeletePayment(r.id)} style={{ color: 'var(--danger)' }}>
                                        <Icon name="delete" size={14} />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={allPayments}
                />

                {showNew && (
                    <Modal title="Registrar Cobro" onClose={() => setShowNew(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleRegisterPayment}>Registrar</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Monto">
                                <input className="form-input" type="number" placeholder="$0.00" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} />
                            </FormField>
                            <FormField label="Método de pago">
                                <select className="form-select" value={newPayment.method} onChange={e => setNewPayment({ ...newPayment, method: e.target.value })}>
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="TARJETA">Tarjeta</option>
                                </select>
                            </FormField>
                            <FormField label="Referencia (opcional)">
                                <input className="form-input" placeholder="Nº tarjeta, CBU, etc." value={newPayment.reference} onChange={e => setNewPayment({ ...newPayment, reference: e.target.value })} />
                            </FormField>
                            <FormField label="OT asociada (opcional)">
                                <select className="form-select" value={newPayment.work_order_id} onChange={e => setNewPayment({ ...newPayment, work_order_id: e.target.value })}>
                                    <option value="">Sin OT</option>
                                    {MOCK.workOrders.map(wo => <option key={wo.id} value={wo.id}>OT #{wo.order_number} - {wo.description}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Descripción">
                                <input className="form-input" placeholder="Descripción del cobro" value={newPayment.description} onChange={e => setNewPayment({ ...newPayment, description: e.target.value })} />
                            </FormField>
                        </div>
                    </Modal>
                )}

                {showEdit && (
                    <Modal title="Editar Movimiento" onClose={() => setShowEdit(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowEdit(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleEditPaymentSubmit}>Actualizar</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Monto">
                                <input className="form-input" type="number" placeholder="$0.00" value={editingPayment.amount} onChange={e => setEditingPayment({ ...editingPayment, amount: e.target.value })} />
                            </FormField>
                            <FormField label="Método de pago">
                                <select className="form-select" value={editingPayment.method} onChange={e => setEditingPayment({ ...editingPayment, method: e.target.value })}>
                                    <option value="EFECTIVO">Efectivo</option>
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="TARJETA">Tarjeta</option>
                                </select>
                            </FormField>
                            <FormField label="Referencia (opcional)">
                                <input className="form-input" placeholder="Nº tarjeta, CBU, etc." value={editingPayment.reference} onChange={e => setEditingPayment({ ...editingPayment, reference: e.target.value })} />
                            </FormField>
                            <FormField label="Descripción">
                                <input className="form-input" placeholder="Descripción del cobro" value={editingPayment.description} onChange={e => setEditingPayment({ ...editingPayment, description: e.target.value })} />
                            </FormField>
                        </div>
                    </Modal>
                )}

                {showClose && (
                    <Modal title="Cierre de Caja Diario" onClose={() => setShowClose(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowClose(false)}>Cancelar</button><button className="btn btn-primary" onClick={handlePerformClose}>Confirmar Cierre</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Saldo anterior:</span>
                                    <span>{formatCurrency(startingBalance)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Ingresos en efectivo:</span>
                                    <span>{formatCurrency(cash)}</span>
                                </div>
                                <hr style={{ borderColor: 'var(--border)', margin: '8px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Efectivo TOTAL esperado:</span>
                                    <strong style={{ color: 'var(--primary)' }}>{formatCurrency(currentExpectedCash)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Transferencias total:</span>
                                    <strong>{formatCurrency(transfer)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Tarjetas total:</span>
                                    <strong>{formatCurrency(card)}</strong>
                                </div>
                            </div>
                            <FormField label="Efectivo real en caja">
                                <input className="form-input" type="number" placeholder="$0.00" value={closingCash} onChange={e => setClosingCash(e.target.value)} />
                            </FormField>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>El cierre guardará el historial y permitirá comparar la diferencia de caja.</p>
                        </div>
                    </Modal>
                )}

                {showWithdrawal && (
                    <Modal title="Retiro / Egreso de Caja" onClose={() => setShowWithdrawal(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowWithdrawal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleRegisterWithdrawal}>Confirmar Retiro</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Monto a retirar *">
                                <input className="form-input" type="number" placeholder="$0.00" value={newWithdrawal.amount} onChange={e => setNewWithdrawal({ ...newWithdrawal, amount: e.target.value })} />
                            </FormField>
                            <FormField label="Motivo o Descripción *">
                                <input className="form-input" placeholder="Ej: Pago repuestos, adelanto empleado..." value={newWithdrawal.description} onChange={e => setNewWithdrawal({ ...newWithdrawal, description: e.target.value })} />
                            </FormField>
                        </div>
                    </Modal>
                )}

                {/* Sección de Comisiones Detallada */}
                <div style={{ marginTop: 24 }}>
                    <SectionHeader icon="engineering" title="Comisiones de Técnicos — Historial Detallado" />
                    {technicians.map(tech => {
                        // Buscar OTs por assignments (sistema correcto)
                        const techAssignments = (MOCK.assignments || []).filter(a => a.mechanic_id === tech.id);
                        const relevantWOs = techAssignments
                            .map(a => {
                                const wo = MOCK.workOrders.find(w => w.id === a.work_order_id);
                                return wo && (wo.status === 'Finalizado' || wo.status === 'Cobrado') ? { ...wo, _assignment: a } : null;
                            })
                            .filter(Boolean);

                        const allEntries = relevantWOs.map(wo => {
                            const vehicle = MOCK.vehicles.find(v => v.id === wo.vehicle_id);
                            const commRate = wo._assignment?.labor_commission_percent || wo.applied_commission_rate || tech.commission_rate || 0;
                            return {
                                wo_number: wo.order_number,
                                date: wo.completed_at?.split('T')[0] || wo.created_at?.split('T')[0] || '—',
                                vehicle: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})` : '—',
                                work_total: wo.labor_cost || 0,
                                percent: commRate,
                                amount: (wo.labor_cost || 0) * (commRate / 100)
                            };
                        });

                        const totalComm = allEntries.reduce((s, e) => s + e.amount, 0);

                        return (
                            <div key={tech.id} style={{ marginBottom: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{tech.name}</div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>Cerrado: {formatCurrency(totalComm)}</div>
                                </div>
                                {allEntries.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Fecha</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>OT #</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Vehículo</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Monto Trabajo</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'center' }}>% Comisión</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'right' }}>$ Comisión</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allEntries.map((e, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '8px 12px' }}>{e.date}</td>
                                                    <td style={{ padding: '8px 12px' }}>#{e.wo_number}</td>
                                                    <td style={{ padding: '8px 12px' }}>{e.vehicle}</td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(e.work_total)}</td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{e.percent}%</td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(e.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Sin trabajos registrados</div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>

            {lastClosing && (
                <PrintableClosing closing={lastClosing} onClose={() => setLastClosing(null)} />
            )}
        </div>
    );
};
