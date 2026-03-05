import React, { useState } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import {
    SectionHeader,
    GlassCard,
    StatCard,
    DataTable,
    Icon,
    Tabs
} from '../components/ui';

export const ReportsPage = () => {
    const { data: MOCK, getClientVehicles } = useApp();
    const [tab, setTab] = useState('revenue');

    // Agrupar ingresos por mes a partir de los pagos (payments)
    const revenueByMonthMap = {};
    (MOCK.payments || []).forEach(p => {
        if (!p.date || p.amount <= 0) return;
        const [year, month] = p.date.split('-');
        const monthKey = `${year}-${month}`;
        revenueByMonthMap[monthKey] = (revenueByMonthMap[monthKey] || 0) + parseFloat(p.amount);
    });

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const REVENUE_BY_MONTH = Object.entries(revenueByMonthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6) // Últimos 6 meses
        .map(([key, value]) => {
            const m = parseInt(key.split('-')[1], 10) - 1;
            return { month: monthNames[m], value, color: 'var(--primary)' };
        });

    if (REVENUE_BY_MONTH.length === 0) {
        REVENUE_BY_MONTH.push({ month: monthNames[new Date().getMonth()], value: 0, color: 'var(--primary)' });
    }

    // Agrupar servicios por categoría básica
    const posSales = (MOCK.payments || []).filter(p => !p.work_order_id && p.type === 'VENTA');
    const wos = (MOCK.workOrders || []).filter(wo => wo.status === 'Finalizado' || wo.status === 'Cobrado');

    const totalPos = posSales.reduce((s, p) => s + parseFloat(p.amount), 0);
    const totalWos = wos.reduce((s, wo) => s + parseFloat(wo.total_price), 0);

    const SERVICES_BY_TYPE = [
        { label: 'Servicios de Taller (OTs)', count: wos.length, value: totalWos, color: 'var(--primary)' },
        { label: 'Ventas de Mostrador (POS)', count: posSales.length, value: totalPos, color: 'var(--success)' },
    ].filter(s => s.value > 0);

    const maxVal = Math.max(...REVENUE_BY_MONTH.map(m => m.value), 1000);

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs
                        tabs={[
                            { key: 'revenue', label: 'Ingresos' },
                            { key: 'services', label: 'Servicios' },
                            { key: 'clients', label: 'Clientes Top' }
                        ]}
                        active={tab}
                        onChange={setTab}
                    />
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-ghost"><Icon name="print" size={18} /> Imprimir Reporte</button>
                    <button className="btn btn-ghost"><Icon name="share" size={18} /> Exportar PDF</button>
                </div>

                {tab === 'revenue' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                            <StatCard icon="trending_up" label="Ingreso Mensual" value={formatCurrency(590000)} sub="+15.2% vs mes anterior" barPercent={85} />
                            <StatCard icon="attach_money" label="Ticket Promedio" value={formatCurrency(18500)} sub="Basado en 32 servicios" barPercent={60} />
                            <StatCard icon="savings" label="Ganancia Estimada" value={formatCurrency(210000)} sub="Margen bruto: 35.6%" barPercent={40} barAlert />
                        </div>

                        <GlassCard style={{ padding: 24 }}>
                            <SectionHeader icon="bar_chart" title="Facturación Histórica (Mensual)" />
                            <div className="revenue-chart" style={{ height: 250, display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 20 }}>
                                {REVENUE_BY_MONTH.map(m => (
                                    <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: `${(m.value / maxVal) * 100}%`,
                                                background: `linear-gradient(to top, ${m.color}, rgba(255,255,255,0.1))`,
                                                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                                transition: 'height 0.4s ease',
                                                position: 'relative'
                                            }}
                                            title={formatCurrency(m.value)}
                                        >
                                            <div style={{
                                                position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                                                fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap'
                                            }}>
                                                {formatCurrency(m.value / 1000)}k
                                            </div>
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{m.month}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                )}

                {tab === 'services' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
                        <GlassCard style={{ padding: 24 }}>
                            <SectionHeader icon="pie_chart" title="Distribución de Ingresos por Tipo" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {SERVICES_BY_TYPE.map(s => (
                                    <div key={s.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label} ({s.count})</span>
                                            <strong style={{ fontSize: 13 }}>{formatCurrency(s.value)}</strong>
                                        </div>
                                        <div className="stat-bar" style={{ height: 8 }}>
                                            <div
                                                className="stat-bar-fill"
                                                style={{ width: `${(s.value / 540000) * 100}%`, background: s.color }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <GlassCard style={{ padding: 16 }}>
                                <SectionHeader icon="bolt" title="Servicio más rentable" />
                                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>Cambio de Aceite</div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Representa el 38% de los ingresos totales.</p>
                            </GlassCard>
                            <GlassCard style={{ padding: 16 }}>
                                <SectionHeader icon="history" title="Recurrencia" />
                                <div style={{ fontSize: 24, fontWeight: 800 }}>68%</div>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>De los clientes han vuelto en los últimos 6 meses.</p>
                            </GlassCard>
                        </div>
                    </div>
                )}

                {tab === 'clients' && (
                    <DataTable
                        columns={[
                            { key: 'name', label: 'Cliente', render: r => <strong>{r.first_name} {r.last_name}</strong> },
                            { key: 'vehicles', label: 'Vehículos', render: r => <span>{getClientVehicles(r.id).length} unidades</span> },
                            {
                                key: 'total_spent', label: 'Total Invertido', render: r => {
                                    const clientWOs = (MOCK.workOrders || []).filter(wo => wo.client_id === r.id && (wo.status === 'Finalizado' || wo.status === 'Cobrado'));
                                    const total = clientWOs.reduce((s, wo) => s + (parseFloat(wo.total_price) || 0), 0);
                                    return <strong style={{ color: 'var(--primary)' }}>{formatCurrency(total)}</strong>;
                                }
                            },
                            {
                                key: 'last_visit', label: 'Última Visita', render: r => {
                                    const lastWO = (MOCK.workOrders || []).find(wo => wo.client_id === r.id);
                                    return lastWO ? lastWO.created_at?.split('T')[0] : '—';
                                }
                            },
                        ]}
                        data={(MOCK.clients || []).slice(0, 10)}
                    />
                )}
            </div>
        </div>
    );
};
