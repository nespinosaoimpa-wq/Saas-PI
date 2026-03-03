import React, { useState, Fragment } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
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
    const [period, setPeriod] = useState('daily');
    const [showNew, setShowNew] = useState(false);
    const [showWithdrawal, setShowWithdrawal] = useState(false);
    const [showClose, setShowClose] = useState(false);
    const [closingCash, setClosingCash] = useState('');
    const [newPayment, setNewPayment] = useState({ amount: '', method: 'EFECTIVO', reference: '', work_order_id: '', description: '' });
    const [newWithdrawal, setNewWithdrawal] = useState({ amount: '', description: '' });

    const technicians = [...new Set(MOCK.workOrders.map(wo => wo.mechanic).filter(Boolean))];

    const handleRegisterPayment = () => {
        if (!newPayment.amount || isNaN(newPayment.amount)) {
            alert('Ingresá un monto válido');
            return;
        }
        addPayment({
            ...newPayment,
            amount: parseFloat(newPayment.amount)
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
            description: newWithdrawal.description || 'Retiro de caja'
        });
        setShowWithdrawal(false);
        setNewWithdrawal({ amount: '', description: '' });
    };

    const handlePerformClose = () => {
        const cash_expected = cash;
        const diff = parseFloat(closingCash || 0) - cash_expected;
        performCashClose({
            cash_expected,
            cash_real: parseFloat(closingCash || 0),
            difference: diff,
            transfer_total: transfer,
            card_total: card,
            total_day: cash + transfer + card
        });
        alert('Cierre de caja realizado con éxito');
        setShowClose(false);
        setClosingCash('');
    };

    const todayPayments = MOCK.payments.filter(p => p.date === new Date().toISOString().split('T')[0] || p.date === '2026-02-27');

    // Cash balance sums positives and negatives correctly (withdrawals are saved as negative)
    const cash = todayPayments.filter(p => p.method === 'EFECTIVO').reduce((s, p) => s + p.amount, 0);
    const transfer = todayPayments.filter(p => p.method === 'TRANSFERENCIA').reduce((s, p) => s + p.amount, 0);
    const card = todayPayments.filter(p => p.method === 'TARJETA').reduce((s, p) => s + p.amount, 0);

    const allPayments = period === 'daily' ? MOCK.payments.filter(p => p.date === '2026-02-27')
        : period === 'weekly' ? MOCK.payments.filter(p => p.date >= '2026-02-21')
            : MOCK.payments;

    const totalPeriod = allPayments.reduce((s, p) => s + p.amount, 0);

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
                        { key: 'amount', label: 'Monto', render: r => <strong style={{ color: r.amount < 0 ? 'var(--danger)' : 'var(--primary)' }}>{formatCurrency(r.amount)}</strong> },
                        { key: 'method', label: 'Método', render: r => <StatusBadge status={r.method === 'EFECTIVO' ? 'Pendiente' : r.method === 'TRANSFERENCIA' ? 'En Box' : 'Finalizado'} /> },
                        { key: 'reference', label: 'Referencia', render: r => r.reference || '—' },
                        { key: 'wo', label: 'OT', render: r => r.work_order_id ? <span className="nav-badge">OT</span> : '—' },
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
                {showClose && (
                    <Modal title="Cierre de Caja Diario" onClose={() => setShowClose(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowClose(false)}>Cancelar</button><button className="btn btn-primary" onClick={handlePerformClose}>Confirmar Cierre</button></Fragment>}>
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

                {/* Sección de Comisiones */}
                <div style={{ marginTop: 24 }}>
                    <SectionHeader icon="engineering" title="Comisiones de Técnicos (Hoy)" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 16 }}>
                        {technicians.map(tech => {
                            const comm = getCommissions(tech);
                            return (
                                <div key={tech} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{tech}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>15% sobre OT finalizadas</div>
                                    </div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>
                                        {formatCurrency(comm)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};
