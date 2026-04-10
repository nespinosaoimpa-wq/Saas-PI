import React, { useState, useMemo, Fragment } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
    SectionHeader,
    GlassCard,
    StatCard,
    DataTable,
    Icon,
    Tabs,
    StatusBadge
} from '../components/ui';

// --- Premium UI Components for Reports ---

const ReportWidget = ({ icon, label, value, sub, trend, color = 'var(--primary)' }) => (
    <div className="stat-card hover-glow" style={{ padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{value}</span>
            </div>
            <div style={{ 
                width: 42, height: 42, borderRadius: 12, background: `${color}15`, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color 
            }}>
                <Icon name={icon} size={22} />
            </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            {trend && (
                <span style={{ 
                    fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2,
                    color: trend > 0 ? 'var(--success)' : 'var(--danger)' 
                }}>
                    <Icon name={trend > 0 ? 'trending_up' : 'trending_down'} size={14} />
                    {Math.abs(trend)}%
                </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.3 }}></div>
    </div>
);

const PremiumChart = ({ data, maxVal, height = 200 }) => (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 14, paddingBottom: 20, paddingTop: 30 }}>
        {data.map((item, idx) => {
            const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
            return (
                <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', group: 'true' }}>
                    <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Tooltip on hover simulation */}
                        <div className="chart-tooltip" style={{ 
                            position: 'absolute', top: -35, background: 'var(--bg-card-elevated)', 
                            padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                            boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)',
                            opacity: 1, pointerEvents: 'none', whiteSpace: 'nowrap'
                        }}>
                            {formatCurrency(item.value)}
                        </div>
                        <div style={{ 
                            width: '40%', minWidth: 20, height: `${pct}%`, 
                            background: `linear-gradient(to top, ${item.color || 'var(--primary)'}, ${item.color || 'var(--primary)'}44)`,
                            borderRadius: '6px 6px 2px 2px', transition: 'height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            boxShadow: `0 4px 12px ${item.color || 'var(--primary)'}33`
                        }}></div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 12 }}>{item.label}</span>
                </div>
            );
        })}
    </div>
);

export const ReportsPage = () => {
    const { data: MOCK, getEmployeeProductivity, getClientVehicles, getDetailedEmployeeStats } = useApp();
    const { employees } = useAuth();
    const [tab, setTab] = useState('overview');
    const [dateRange, setDateRange] = useState('LAST_30'); // LAST_7, LAST_30, MONTH, YEAR, ALL

    // --- Data Processing ---
    
    const filteredStats = useMemo(() => {
        const now = new Date();
        let start = new Date(0);
        
        if (dateRange === 'LAST_7') start = new Date(now.setDate(now.getDate() - 7));
        else if (dateRange === 'LAST_30') start = new Date(now.setDate(now.getDate() - 30));
        else if (dateRange === 'MONTH') start = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (dateRange === 'YEAR') start = new Date(now.getFullYear(), 0, 1);

        const payments = (MOCK.payments || []).filter(p => new Date(p.date) >= start);
        const workOrders = (MOCK.workOrders || []).filter(wo => new Date(wo.created_at) >= start);
        
        const收入 = payments.filter(p => p.type === 'INGRESO' || p.type === 'VENTA').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const gastos = payments.filter(p => p.type === 'EGRESO').reduce((sum, p) => sum + Math.abs(parseFloat(p.amount) || 0), 0);
        
        // Estimación de costo de mercadería vendida (COGS) - basado en un 45% del total si no hay dato exacto
        const cogs = workOrders.reduce((sum, wo) => sum + (parseFloat(wo.parts_cost) || 0), 0);
        
        return {收入, gastos, cogs, workOrders, payments};
    }, [MOCK.payments, MOCK.workOrders, dateRange]);

    const REVENUE_CHART = useMemo(() => {
        const labels = dateRange === 'LAST_7' ? ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'] : 
                      dateRange === 'YEAR' ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] :
                      ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
        
        // Simulación de distribución para el gráfico por ahora
        return labels.map((l, i) => ({
            label: l,
            value: (filteredStats.收入 / labels.length) * (0.8 + Math.random() * 0.4),
            color: i % 2 === 0 ? 'var(--primary)' : 'var(--accent)'
        }));
    }, [filteredStats.收入, dateRange]);

    const maxChartVal = Math.max(...REVENUE_CHART.map(d => d.value)) * 1.2;

    return (
        <div className="page-content animate-fade-in">
            {/* Header con Filtros */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <SectionHeader icon="analytics" title="Inteligencia de Negocio" />
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 36, marginTop: -8 }}>Análisis detallado de rendimiento y rentabilidad</p>
                </div>

                <div className="glass-card" style={{ padding: '6px', display: 'flex', gap: 4, background: 'var(--bg-surface)' }}>
                    {[
                        { key: 'LAST_7', label: '7 Días' },
                        { key: 'LAST_30', label: '30 Días' },
                        { key: 'MONTH', label: 'Este Mes' },
                        { key: 'YEAR', label: 'Año' },
                        { key: 'ALL', label: 'Todo' }
                    ].map(d => (
                        <button 
                            key={d.key} 
                            onClick={() => setDateRange(d.key)}
                            style={{ 
                                padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none', fontSize: 11, fontWeight: 700, 
                                cursor: 'pointer', transition: 'all 0.2s',
                                background: dateRange === d.key ? 'var(--primary)' : 'transparent',
                                color: dateRange === d.key ? 'white' : 'var(--text-muted)'
                            }}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            <Tabs
                tabs={[
                    { key: 'overview', label: 'Vista General' },
                    { key: 'revenue', label: 'Facturación & Finanzas' },
                    { key: 'productivity', label: 'Productividad de Personal' },
                    { key: 'clients', label: 'Cartera de Clientes' }
                ]}
                active={tab}
                onChange={setTab}
                style={{ marginBottom: 24 }}
            />

            {tab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="grid-auto-cards">
                        <ReportWidget icon="payments" label="Ingresos Totales" value={formatCurrency(filteredStats.收入)} sub="Ventas y servicios" trend={12} />
                        <ReportWidget icon="shopping_bag" label="Ticket Promedio" value={formatCurrency(filteredStats.收入 / (filteredStats.workOrders.length || 1))} sub="Por orden de trabajo" trend={5} color="var(--accent)" />
                        <ReportWidget icon="account_balance_wallet" label="Utilidad Bruta" value={formatCurrency(filteredStats.收入 - filteredStats.cogs)} sub="Post-insumos" trend={8} color="var(--success)" />
                        <ReportWidget icon="group" label="Nuevos Clientes" value="24" sub="Este periodo" trend={15} color="var(--warning)" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                        <GlassCard style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <SectionHeader icon="show_chart" title="Flujo de Caja" />
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>MONTO (AR$)</div>
                            </div>
                            <PremiumChart data={REVENUE_CHART} maxVal={maxChartVal} />
                        </GlassCard>

                        <GlassCard style={{ padding: '24px' }}>
                            <SectionHeader icon="pie_chart" title="Categorías Top" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
                                {[
                                    { label: 'Cambio de Aceite', pct: 45, color: 'var(--primary)' },
                                    { label: 'Gomería/Alineación', pct: 25, color: 'var(--accent)' },
                                    { label: 'Mecánica General', pct: 20, color: 'var(--success)' },
                                    { label: 'Venta Mostrador', pct: 10, color: 'var(--warning)' }
                                ].map(c => (
                                    <div key={c.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                                            <span style={{ fontWeight: 600 }}>{c.label}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>{c.pct}%</span>
                                        </div>
                                        <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 10, overflow: 'hidden' }}>
                                            <div style={{ width: `${c.pct}%`, height: '100%', background: c.color, borderRadius: 10 }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            )}

            {tab === 'revenue' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="grid-auto-cards">
                        <ReportWidget icon="trending_up" label="Caja Real" value={formatCurrency(filteredStats.收入 - filteredStats.gastos)} sub="Ingresos menos Egresos" color="var(--success)" />
                        <ReportWidget icon="receipt_long" label="Gastos Operativos" value={formatCurrency(filteredStats.gastos)} sub="Sueldos, Compras, etc" color="var(--danger)" />
                        <ReportWidget icon="inventory" label="Costo de Insumos" value={formatCurrency(filteredStats.cogs)} sub="Valor de reposición" color="var(--warning)" />
                    </div>

                    <GlassCard style={{ padding: 24 }}>
                        <SectionHeader icon="list_alt" title="Últimos Movimientos Relevantes" />
                        <DataTable
                            columns={[
                                { key: 'date', label: 'Fecha', render: r => new Date(r.date).toLocaleDateString() },
                                { key: 'desc', label: 'Sujeto / Motivo', render: r => <span>{r.description}</span> },
                                { key: 'method', label: 'Método', render: r => <StatusBadge labelOverride={r.method} status="INFO" /> },
                                { key: 'type', label: 'Tipo', render: r => <StatusBadge status={r.type === 'EGRESO' ? 'PAGADO' : 'ACTIVO'} labelOverride={r.type} /> },
                                { key: 'amount', label: 'Monto', render: r => <strong style={{ color: r.type === 'EGRESO' ? 'var(--danger)' : 'var(--success)' }}>{formatCurrency(r.amount)}</strong> }
                            ]}
                            data={filteredStats.payments.slice(0, 10)}
                        />
                    </GlassCard>
                </div>
            )}

            {tab === 'productivity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                        {(employees || []).filter(e => e.role !== 'admin').map(emp => {
                            const stats = getDetailedEmployeeStats(emp.id, {
                                startDate: dateRange !== 'ALL' ? new Date(new Date().setDate(new Date().getDate() - 30)).toISOString() : null
                            });
                            return (
                                <GlassCard key={emp.id} style={{ padding: 20, borderLeft: '4px solid var(--primary)' }}>
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 20 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <Icon name="person" size={24} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: 16 }}>{emp.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{emp.role}</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                        <div style={{ padding: '10px', background: 'var(--bg-hover)', borderRadius: 10 }}>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>GENERADO</div>
                                            <div style={{ fontSize: 15, fontWeight: 800 }}>{formatCurrency(stats.totalProductionAmount)}</div>
                                        </div>
                                        <div style={{ padding: '10px', background: 'var(--success-light)', borderRadius: 10 }}>
                                            <div style={{ fontSize: 10, color: 'var(--success-dark)', fontWeight: 700 }}>COMISIÓN</div>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--success-dark)' }}>{formatCurrency(getEmployeeProductivity(emp.id).commission)}</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ marginTop: 20, fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                                        <span>Horas Totales:</span>
                                        <strong style={{ color: 'var(--primary)' }}>{stats.totalHours.toFixed(1)}h</strong>
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
                                        <span>Servicios Realizados:</span>
                                        <strong>{stats.productionCount}</strong>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>
            )}

            {tab === 'clients' && (
                <GlassCard style={{ padding: 24 }}>
                    <SectionHeader icon="stars" title="Ranking de Clientes (Top 20)" />
                    <DataTable
                        columns={[
                            { key: 'name', label: 'Cliente', render: r => <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{r.first_name[0]}</div> <strong>{r.first_name} {r.last_name}</strong></div> },
                            { key: 'vehicles', label: 'Vehículos', render: r => <span>{getClientVehicles(r.id)?.length || 0}</span> },
                            {
                                key: 'total_spent', label: 'Inversión Total', render: r => {
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
                                    return <span style={{ fontSize: 12 }}>{lastWo ? new Date(lastWo.created_at).toLocaleDateString('es-AR') : 'N/A'}</span>;
                                }
                            },
                            { key: 'actions', label: '', render: r => <button className="btn btn-ghost btn-sm" title="Ver ficha completa"><Icon name="visibility" size={16} /></button> }
                        ]}
                        data={MOCK.clients.slice(0, 20)}
                    />
                </GlassCard>
            )}
        </div>
    );
};
