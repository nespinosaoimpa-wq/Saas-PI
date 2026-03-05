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
    Icon
} from '../components/ui';

export const CashRegisterPage = () => {
    const { data: MOCK, addPayment, performCashClose, addWithdrawal, getCommissions } = useApp();
    const { employees, user } = useAuth();
    const [period, setPeriod] = useState('daily');
    const [showNew, setShowNew] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [showClose, setShowClose] = useState(false);
    const [closingCash, setClosingCash] = useState('');
    const [saving, setSaving] = useState(false);
    const [newPayment, setNewPayment] = useState({ amount: '', method: 'EFECTIVO', reference: '', work_order_id: '', description: '' });
    const [newWithdrawal, setNewWithdrawal] = useState({ amount: '', description: '' });

    const payments = MOCK.payments || [];
    const today = new Date().toISOString().split('T')[0];

    // Filtrar pagos de hoy
    const todayPayments = payments.filter(p => p.date === today);

    // Calcular balances
    const cash = todayPayments.filter(p => p.method === 'EFECTIVO').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const transfer = todayPayments.filter(p => p.method === 'TRANSFERENCIA').reduce((s, p) => s + parseFloat(p.amount || 0), 0);
    const card = todayPayments.filter(p => p.method === 'TARJETA').reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    // Filtrar por período
    const getStartDate = () => {
        const d = new Date();
        if (period === 'daily') return today;
        if (period === 'weekly') { d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; }
        d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
    };

    const allPayments = period === 'daily'
        ? payments.filter(p => p.date === today)
        : payments.filter(p => p.date >= getStartDate());

    const totalPeriod = allPayments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    // Técnicos para comisiones
    const mechanics = employees.filter(e => e.role === 'mecanico' || e.role === 'gomero');

    const handleRegisterPayment = async () => {
        if (!newPayment.amount || isNaN(newPayment.amount)) {
            alert('Ingresá un monto válido');
            return;
        }
        setSaving(true);
        try {
            await addPayment({
                amount: parseFloat(newPayment.amount),
                method: newPayment.method,
                reference: newPayment.reference,
                work_order_id: newPayment.work_order_id || null,
                description: newPayment.description || 'Ingreso manual',
                type: newPayment.work_order_id ? 'OT' : 'INGRESO',
                employee_id: user?.id || null
            });
            setShowNew(false);
            setNewPayment({ amount: '', method: 'EFECTIVO', reference: '', work_order_id: '', description: '' });
        } catch (err) {
            alert('Error al registrar cobro: ' + (err.message || ''));
        }
        setSaving(false);
    };

    const handleRegisterWithdrawal = async () => {
        if (!newWithdrawal.amount || isNaN(newWithdrawal.amount)) {
            alert('Ingresá un monto válido para el egreso');
            return;
        }
        setSaving(true);
        try {
            await addWithdrawal({
                amount: parseFloat(newWithdrawal.amount),
                description: newWithdrawal.description || 'Retiro de caja',
                employee_id: user?.id || null
            });
            setShowWithdrawal(false);
            setNewWithdrawal({ amount: '', description: '' });
        } catch (err) {
            alert('Error al registrar retiro: ' + (err.message || ''));
        }
        setSaving(false);
    };

    const handlePerformClose = async () => {
        setSaving(true);
        try {
            const cash_expected = cash;
            const diff = parseFloat(closingCash || 0) - cash_expected;
            await performCashClose({
                cash_expected,
                cash_real: parseFloat(closingCash || 0),
                difference: diff,
                transfer_total: transfer,
                card_total: card,
                total_day: cash + transfer + card,
                employee_id: user?.id || null
            });
            alert('Cierre de caja realizado con éxito');
            setShowClose(false);
            setClosingCash('');
        } catch (err) {
            alert('Error al cerrar caja: ' + (err.message || ''));
        }
        setSaving(false);
    };

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs tabs={[{ key: 'daily', label: 'Diario' }, { key: 'weekly', label: 'Semanal' }, { key: 'monthly', label: 'Mensual' }]} active={period} onChange={setPeriod} />
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-ghost" onClick={() => setShowClose(true)}><Icon name="lock" size={18} /> Cierre de Caja</button>
                    <button className="btn btn-ghost" onClick={() => setShowWithdrawal(true)}><Icon name="money_off" size={18} /> Retiro / Egreso</button>
                    <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="add" size={18} /> Registrar Ingreso</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                    <StatCard icon="payments" label={`Total ${period === 'daily' ? 'Hoy' : period === 'weekly' ? 'Semana' : 'Mes'}`} value={formatCurrency(totalPeriod)} sub={`${allPayments.length} operaciones`} barPercent={75} />
                    <StatCard icon="account_balance_wallet" label="Efectivo" value={formatCurrency(cash)} sub="Hoy" barPercent={cash > 0 ? 100 : 0} barAlert />
                    <StatCard icon="swap_horiz" label="Transferencias" value={formatCurrency(transfer)} sub="Hoy" barPercent={transfer > 0 ? 100 : 0} />
                    <StatCard icon="credit_card" label="Tarjeta" value={formatCurrency(card)} sub="Hoy" barPercent={card > 0 ? 100 : 0} />
                </div>

                <DataTable
                    columns={[
                        { key: 'date', label: 'Fecha' },
                        { key: 'amount', label: 'Monto', render: r => <strong style={{ color: parseFloat(r.amount) < 0 ? 'var(--danger)' : 'var(--primary)' }}>{formatCurrency(parseFloat(r.amount))}</strong> },
                        { key: 'method', label: 'Método', render: r => <StatusBadge status={r.method === 'EFECTIVO' ? 'Pendiente' : r.method === 'TRANSFERENCIA' ? 'En Box' : 'Finalizado'} labelOverride={r.method} /> },
                        { key: 'description', label: 'Descripción', render: r => r.description || '—' },
                        { key: 'reference', label: 'Referencia', render: r => r.reference || '—' },
                        { key: 'type', label: 'Tipo', render: r => <span className="nav-badge">{r.type || '—'}</span> },
                    ]}
                    data={allPayments}
                />

                {showNew && (
                    <Modal title="Registrar Cobro" onClose={() => setShowNew(false)}
                        footer={<Fragment><button className="btn btn-ghost" disabled={saving} onClick={() => setShowNew(false)}>Cancelar</button><button className="btn btn-primary" disabled={saving} onClick={handleRegisterPayment}>{saving ? 'Guardando...' : 'Registrar'}</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Monto *">
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
                                    {(MOCK.workOrders || []).map(wo => <option key={wo.id} value={wo.id}>OT #{wo.order_number} - {wo.description}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Descripción">
                                <input className="form-input" placeholder="Descripción del cobro" value={newPayment.description} onChange={e => setNewPayment({ ...newPayment, description: e.target.value })} />
                            </FormField>
                        </div>
                    </Modal>
                )}

                {showClose && (
                    <Modal title="Cierre de Caja Diario" onClose={() => setShowClose(false)}
                        footer={<Fragment><button className="btn btn-ghost" disabled={saving} onClick={() => setShowClose(false)}>Cancelar</button><button className="btn btn-primary" disabled={saving} onClick={handlePerformClose}>{saving ? 'Procesando...' : 'Confirmar Cierre'}</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Efectivo esperado:</span>
                                    <strong style={{ color: 'var(--primary)' }}>{formatCurrency(cash)}</strong>
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
                            {closingCash && (
                                <div style={{ padding: 12, background: Math.abs(parseFloat(closingCash) - cash) > 0 ? 'rgba(var(--danger-rgb), 0.06)' : 'rgba(var(--success-rgb), 0.06)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                    <span style={{ fontWeight: 700, color: parseFloat(closingCash) - cash >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                        Diferencia: {formatCurrency(parseFloat(closingCash) - cash)}
                                    </span>
                                </div>
                            )}
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>El cierre guardará el historial y permitirá comparar la diferencia de caja.</p>
                        </div>
                    </Modal>
                )}

                {showWithdrawal && (
                    <Modal title="Retiro / Egreso de Caja" onClose={() => setShowWithdrawal(false)}
                        footer={<Fragment><button className="btn btn-ghost" disabled={saving} onClick={() => setShowWithdrawal(false)}>Cancelar</button><button className="btn btn-primary" disabled={saving} onClick={handleRegisterWithdrawal}>{saving ? 'Guardando...' : 'Confirmar Retiro'}</button></Fragment>}>
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
                    {mechanics.map(tech => {
                        const techWOs = (MOCK.workOrders || []).filter(wo =>
                            wo.mechanic_id === tech.id && (wo.status === 'Finalizado' || wo.status === 'Cobrado')
                        );

                        const allEntries = techWOs.map(wo => {
                            const vehicle = (MOCK.vehicles || []).find(v => v.id === wo.vehicle_id);
                            const commRate = parseFloat(wo.applied_commission_rate) || parseFloat(tech.commission_rate) || 0;
                            const laborCost = parseFloat(wo.labor_cost) || 0;
                            return {
                                wo_number: wo.order_number,
                                date: wo.created_at?.split('T')[0] || '—',
                                vehicle: vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})` : '—',
                                work_total: parseFloat(wo.total_price) || 0,
                                labor: laborCost,
                                percent: commRate,
                                amount: laborCost * (commRate / 100)
                            };
                        });

                        const totalComm = allEntries.reduce((s, e) => s + e.amount, 0);

                        return (
                            <div key={tech.id} style={{ marginBottom: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-hover)', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{tech.name} <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>({tech.role.toUpperCase()} — {tech.commission_rate}% base)</span></div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>Total a pagar: {formatCurrency(totalComm)}</div>
                                </div>
                                {allEntries.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Fecha</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>OT #</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Vehículo</th>
                                                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Mano Obra</th>
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
                                                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(e.labor)}</td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600 }}>{e.percent}%</td>
                                                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(e.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Sin trabajos finalizados</div>
                                )}
                            </div>
                        );
                    })}
                    {mechanics.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                            <Icon name="engineering" size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                            <p>No hay técnicos registrados. Agregá mecánicos desde la sección Usuarios.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
