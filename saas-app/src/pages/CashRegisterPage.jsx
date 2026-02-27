import React, { useState, Fragment } from 'react';
import { MOCK, formatCurrency } from '../data/data';
import {
    Tabs,
    StatCard,
    DataTable,
    Modal,
    FormField,
    StatusBadge,
    Icon
} from '../components/ui';

export const CashRegisterPage = () => {
    const [period, setPeriod] = useState('daily');
    const [showNew, setShowNew] = useState(false);

    const todayPayments = MOCK.payments.filter(p => p.date === '2026-02-27');
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
                    <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="add" size={18} /> Registrar Cobro</button>
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
                        { key: 'amount', label: 'Monto', render: r => <strong style={{ color: 'var(--primary)' }}>{formatCurrency(r.amount)}</strong> },
                        { key: 'method', label: 'MÃ©todo', render: r => <StatusBadge status={r.method === 'EFECTIVO' ? 'Pendiente' : r.method === 'TRANSFERENCIA' ? 'En Box' : 'Finalizado'} /> },
                        { key: 'reference', label: 'Referencia', render: r => r.reference || 'â€”' },
                        { key: 'wo', label: 'OT', render: r => r.work_order_id ? <span className="nav-badge">OT</span> : 'â€”' },
                    ]}
                    data={allPayments}
                />

                {showNew && (
                    <Modal title="Registrar Cobro" onClose={() => setShowNew(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button><button className="btn btn-primary">Registrar</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Monto"><input className="form-input" type="number" placeholder="$0.00" /></FormField>
                            <FormField label="MÃ©todo de pago">
                                <select className="form-select"><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option></select>
                            </FormField>
                            <FormField label="Referencia (opcional)"><input className="form-input" placeholder="NÂº tarjeta, CBU, etc." /></FormField>
                            <FormField label="OT asociada (opcional)">
                                <select className="form-select"><option value="">Sin OT</option>{MOCK.workOrders.map(wo => <option key={wo.id} value={wo.id}>OT #{wo.order_number} - {wo.description}</option>)}</select>
                            </FormField>
                            <FormField label="DescripciÃ³n"><input className="form-input" placeholder="DescripciÃ³n del cobro" /></FormField>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};
