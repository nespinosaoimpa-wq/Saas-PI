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
    const { data: MOCK } = useApp();
    const [tab, setTab] = useState('revenue');

    // MOCK logic for reports (since we don't have a real backend yet)
    const REVENUE_BY_MONTH = [
        { month: 'Ene', value: 450000, color: 'var(--primary)' },
        { month: 'Feb', value: 620000, color: 'var(--primary)' },
        { month: 'Mar', value: 580000, color: 'var(--primary)' },
        { month: 'Abr', value: 710000, color: 'var(--primary)' },
        { month: 'May', value: 590000, color: 'var(--accent)' },
    ];

    const SERVICES_BY_TYPE = [
        { label: 'Cambio de Aceite', count: 45, value: 540000, color: 'var(--primary)' },
        { label: 'Frenos', count: 28, value: 310000, color: 'var(--success)' },
        { label: 'Gomería Express', count: 112, value: 280000, color: 'var(--warning)' },
        { label: 'Mecánica Gral', count: 15, value: 420000, color: 'var(--accent)' },
    ];

    const maxVal = Math.max(...REVENUE_BY_MONTH.map(m => m.value));

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
                            { key: 'vehicles', label: 'Vehículos', render: r => <span>{r.vehicles.length} unidades</span> },
                            { key: 'total_spent', label: 'Total Invertido', render: r => <strong style={{ color: 'var(--primary)' }}>{formatCurrency(Math.floor(Math.random() * 150000) + 50000)}</strong> },
                            { key: 'last_visit', label: 'Última Visita', render: r => 'Hace 12 días' },
                        ]}
                        data={MOCK.clients.slice(0, 5)}
                    />
                )}
            </div>
        </div>
    );
};
