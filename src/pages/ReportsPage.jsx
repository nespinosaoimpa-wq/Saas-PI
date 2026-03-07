import React, { useState, useMemo } from 'react';
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

    // Lógica REAL para reportes basada en los datos cargados
    const payments = MOCK.payments || [];
    const workOrders = MOCK.workOrders || [];

    // Calcular ingresos de los últimos 5 meses
    const REVENUE_BY_MONTH = useMemo(() => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const last5 = [];
        const now = new Date();

        for (let i = 4; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mIdx = d.getMonth();
            const mName = months[mIdx];
            const mYear = d.getFullYear();

            const total = payments
                .filter(p => {
                    const pDate = new Date(p.date);
                    return p.type === 'INGRESO' && pDate.getMonth() === mIdx && pDate.getFullYear() === mYear;
                })
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            last5.push({ month: mName, value: total, color: 'var(--primary)' });
        }
        return last5;
    }, [payments]);

    // Calcular distribución de servicios por descripción (top 4)
    const SERVICES_BY_TYPE = useMemo(() => {
        const counts = {};
        workOrders.forEach(wo => {
            const desc = wo.description?.split(' ')[0] || 'General';
            counts[desc] = (counts[desc] || { count: 0, value: 0 });
            counts[desc].count++;
            counts[desc].value += (parseFloat(wo.total_price) || 0);
        });

        return Object.entries(counts)
            .map(([label, data]) => ({ label, ...data, color: 'var(--primary)' }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 4);
    }, [workOrders]);

    const totalRevenue = REVENUE_BY_MONTH.reduce((sum, m) => sum + m.value, 0);
    const avgTicket = workOrders.length > 0 ? (totalRevenue / workOrders.length) : 0;

    const maxVal = Math.max(...REVENUE_BY_MONTH.map(m => m.value));

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs
                        tabs={[
                            { key: 'revenue', label: 'Ingresos' },
                            { key: 'services', label: 'Servicios' },
                            { key: 'productivity', label: 'Productividad' },
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
                        <div className="grid-auto-cards">
                            <StatCard icon="trending_up" label="Ingreso Periodo" value={formatCurrency(totalRevenue)} sub="Total últimos 5 meses" barPercent={100} />
                            <StatCard icon="attach_money" label="Ticket Promedio" value={formatCurrency(avgTicket)} sub={`Basado en ${workOrders.length} OTs`} barPercent={60} />
                            <StatCard icon="savings" label="Ganancia Estimada (Bruta)" value={formatCurrency(totalRevenue * 0.4)} sub="Margen estimado: 40%" barPercent={40} barAlert />
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
                    <div className="grid-reports">
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

                {tab === 'productivity' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <SectionHeader icon="engineering" title="Rendimiento del Personal" />
                        <div className="grid-auto-cards-sm">
                            {(MOCK.employees || []).filter(e => e.role === 'mecanico' || e.role === 'gomero').map(emp => {
                                const prod = MOCK.getEmployeeProductivity(emp.id);
                                return (
                                    <GlassCard key={emp.id} style={{ padding: 16 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <strong style={{ fontSize: 14 }}>{emp.name}</strong>
                                            <StatusBadge status="En Box" labelOverride={emp.role.toUpperCase()} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Trabajos:</span>
                                                <strong>{prod.count}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Generado (MO):</span>
                                                <strong>{formatCurrency(prod.total_labor)}</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                                                <span style={{ fontWeight: 600, fontSize: 13 }}>Comisión:</span>
                                                <strong style={{ color: 'var(--primary)', fontSize: 14 }}>{formatCurrency(prod.commission)}</strong>
                                            </div>
                                        </div>
                                    </GlassCard>
                                );
                            })}
                        </div>

                        <GlassCard style={{ padding: 20 }}>
                            <SectionHeader icon="list_alt" title="Detalle de Comisiones" />
                            <DataTable
                                columns={[
                                    { key: 'name', label: 'Empleado', render: r => <strong>{r.name}</strong> },
                                    { key: 'count', label: 'OTs', render: r => MOCK.getEmployeeProductivity(r.id).count },
                                    { key: 'labor', label: 'Mano de Obra', render: r => formatCurrency(MOCK.getEmployeeProductivity(r.id).total_labor) },
                                    { key: 'comm', label: 'A Pagar', render: r => <strong style={{ color: 'var(--success)' }}>{formatCurrency(MOCK.getEmployeeProductivity(r.id).commission)}</strong> }
                                ]}
                                data={(MOCK.employees || []).filter(e => e.role === 'mecanico' || e.role === 'gomero')}
                            />
                        </GlassCard>
                    </div>
                )}

                {tab === 'clients' && (
                    <DataTable
                        columns={[
                            { key: 'name', label: 'Cliente', render: r => <strong>{r.first_name} {r.last_name}</strong> },
                            { key: 'vehicles', label: 'Vehículos', render: r => <span>{MOCK.getClientVehicles(r.id)?.length || 0} unidades</span> },
                            {
                                key: 'total_spent', label: 'Total Invertido', render: r => {
                                    const spent = (MOCK.payments || [])
                                        .filter(p => {
                                            const wo = MOCK.workOrders?.find(w => w.id === p.work_order_id);
                                            return wo && wo.client_id === r.id;
                                        })
                                        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                                    return <strong style={{ color: 'var(--primary)' }}>{formatCurrency(spent)}</strong>;
                                }
                            },
                            {
                                key: 'last_visit', label: 'Última Visita', render: r => {
                                    const lastWo = MOCK.workOrders?.filter(w => w.client_id === r.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                                    return lastWo ? new Date(lastWo.created_at).toLocaleDateString('es-AR') : 'N/A';
                                }
                            },
                        ]}
                        data={MOCK.clients.slice(0, 10)}
                    />
                )}
            </div>
        </div>
    );
};
