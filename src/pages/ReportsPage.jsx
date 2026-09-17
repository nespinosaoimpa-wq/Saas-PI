import React, { useState, useMemo, Fragment } from 'react';
import { formatCurrency, getCurrentWeekRange, getMonthRange, extractItemDateStr } from '../data/data';
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

const PremiumChart = ({ data, maxVal, height = 240 }) => {
    const validMax = maxVal > 0 ? maxVal : 1;
    const gridLines = [1, 0.75, 0.5, 0.25, 0];

    return (
        <div style={{ position: 'relative', width: '100%', height, padding: '20px 10px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Background Grid Lines & Scale */}
            <div style={{ position: 'absolute', inset: '20px 10px 40px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                {gridLines.map((ratio, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', width: 55, textAlign: 'right', fontFamily: 'var(--font-racing)' }}>
                            {formatCurrency(validMax * ratio)}
                        </span>
                        <div style={{ flex: 1, height: 1, borderTop: ratio === 0 ? '1px solid rgba(255, 255, 255, 0.15)' : '1px dashed rgba(255, 255, 255, 0.05)' }} />
                    </div>
                ))}
            </div>

            {/* Bars & Interactive Area */}
            <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', alignItems: 'flex-end', gap: 16, paddingLeft: 65, paddingBottom: 25, paddingTop: 10 }}>
                {data.map((item, idx) => {
                    const pct = Math.min(Math.max((item.value / validMax) * 100, 4), 100);
                    const isZero = item.value === 0;

                    return (
                        <div key={idx} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                            {/* Value Pill Badge */}
                            <div style={{ 
                                marginBottom: 8, 
                                background: isZero ? 'rgba(255, 255, 255, 0.04)' : 'rgba(17, 24, 39, 0.92)',
                                border: isZero ? '1px solid rgba(255, 255, 255, 0.08)' : `1px solid ${item.color || 'var(--primary)'}55`,
                                padding: '4px 10px', 
                                borderRadius: 6, 
                                fontSize: 11, 
                                fontWeight: 800,
                                color: isZero ? 'var(--text-muted)' : 'var(--text-primary)',
                                boxShadow: isZero ? 'none' : `0 4px 14px ${item.color || 'var(--primary)'}22`,
                                backdropFilter: 'blur(8px)',
                                zIndex: 3,
                                whiteSpace: 'nowrap',
                                transition: 'transform 0.2s',
                            }}>
                                {formatCurrency(item.value)}
                            </div>

                            {/* Bar Column Container */}
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                <div style={{ 
                                    width: '36%', 
                                    minWidth: 24,
                                    maxWidth: 64,
                                    height: `${pct}%`, 
                                    background: isZero 
                                        ? 'rgba(255, 255, 255, 0.04)' 
                                        : `linear-gradient(180deg, ${item.color || 'var(--primary)'} 0%, rgba(245, 158, 11, 0.15) 100%)`,
                                    borderRadius: '8px 8px 3px 3px', 
                                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: isZero ? 'none' : `0 4px 20px ${item.color || 'var(--primary)'}40, inset 0 1px 0 rgba(255, 255, 255, 0.4)`,
                                    borderTop: isZero ? 'none' : `2px solid ${item.color || 'var(--primary)'}`,
                                    position: 'relative'
                                }}>
                                    {!isZero && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: 4,
                                            background: '#fff',
                                            borderRadius: '8px 8px 0 0',
                                            boxShadow: `0 0 10px ${item.color || 'var(--primary)'}`
                                        }} />
                                    )}
                                </div>
                            </div>

                            {/* Bottom Label */}
                            <span style={{ 
                                fontSize: 11, 
                                fontWeight: 700, 
                                color: isZero ? 'var(--text-muted)' : 'var(--text-primary)', 
                                marginTop: 12,
                                letterSpacing: '0.3px',
                                textTransform: 'uppercase'
                            }}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const ReportsPage = () => {
    const { data: MOCK, getEmployeeProductivity, getClientVehicles, getDetailedEmployeeStats } = useApp();
    const { employees } = useAuth();
    const [tab, setTab] = useState('overview');
    const [dateRange, setDateRange] = useState('MONTH'); // 'WEEK', 'MONTH', 'YEAR', 'ALL'
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toLocaleDateString('en-CA').slice(0, 7));

    const availableMonths = useMemo(() => {
        const set = new Set();
        (MOCK.payments || []).forEach(p => {
            const d = extractItemDateStr(p);
            if (d && d.length >= 7) set.add(d.slice(0, 7));
        });
        const nowStr = new Date().toLocaleDateString('en-CA').slice(0, 7);
        set.add(nowStr);
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [MOCK.payments]);

    const weekRange = getCurrentWeekRange();
    const monthRange = getMonthRange(selectedMonth);

    // --- Data Processing ---
    
    const filteredStats = useMemo(() => {
        const now = new Date();
        let payments = [];
        let workOrders = [];

        if (dateRange === 'WEEK') {
            payments = (MOCK.payments || []).filter(p => {
                const d = extractItemDateStr(p);
                return d && d >= weekRange.start && d <= weekRange.end;
            });
            workOrders = (MOCK.workOrders || []).filter(wo => {
                const d = (wo.created_at || '').split('T')[0];
                return d && d >= weekRange.start && d <= weekRange.end;
            });
        } else if (dateRange === 'MONTH') {
            payments = (MOCK.payments || []).filter(p => {
                const d = extractItemDateStr(p);
                return d && d >= monthRange.start && d <= monthRange.end;
            });
            workOrders = (MOCK.workOrders || []).filter(wo => {
                const d = (wo.created_at || '').split('T')[0];
                return d && d >= monthRange.start && d <= monthRange.end;
            });
        } else if (dateRange === 'YEAR') {
            const yearStr = String(now.getFullYear());
            payments = (MOCK.payments || []).filter(p => extractItemDateStr(p).startsWith(yearStr));
            workOrders = (MOCK.workOrders || []).filter(wo => (wo.created_at || '').startsWith(yearStr));
        } else {
            payments = MOCK.payments || [];
            workOrders = MOCK.workOrders || [];
        }
        
        const ingresos = payments.filter(p => p.type === 'INGRESO' || p.type === 'VENTA' || (!p.type && p.amount > 0)).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const gastos = payments.filter(p => p.type === 'EGRESO' || (!p.type && p.amount < 0)).reduce((sum, p) => sum + Math.abs(parseFloat(p.amount) || 0), 0);
        
        // Estimación de costo de mercadería vendida (COGS)
        const cogs = workOrders.reduce((sum, wo) => sum + (parseFloat(wo.parts_cost) || 0), 0);
        
        return { ingresos, gastos, cogs, workOrders, payments };
    }, [MOCK.payments, MOCK.workOrders, dateRange, selectedMonth, weekRange, monthRange]);

    const REVENUE_CHART = useMemo(() => {
        if (dateRange === 'WEEK') {
            const days = [
                { label: 'Lun', dayIdx: 1 },
                { label: 'Mar', dayIdx: 2 },
                { label: 'Mié', dayIdx: 3 },
                { label: 'Jue', dayIdx: 4 },
                { label: 'Vie', dayIdx: 5 },
                { label: 'Sáb', dayIdx: 6 },
                { label: 'Dom', dayIdx: 7 },
            ];
            return days.map(({ label, dayIdx }) => {
                const targetDate = new Date(weekRange.monday);
                targetDate.setDate(weekRange.monday.getDate() + (dayIdx - 1));
                const pad = (n) => String(n).padStart(2, '0');
                const targetDateStr = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;

                const amount = filteredStats.payments
                    .filter(p => extractItemDateStr(p) === targetDateStr && (p.amount > 0 || p.type === 'INGRESO' || p.type === 'VENTA'))
                    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

                return { label, value: amount, color: 'var(--primary)' };
            });
        }

        if (dateRange === 'MONTH') {
            const periods = [
                { label: 'Días 1-7', from: 1, to: 7 },
                { label: 'Días 8-14', from: 8, to: 14 },
                { label: 'Días 15-21', from: 15, to: 21 },
                { label: `Días 22-${monthRange.end.slice(8)}`, from: 22, to: parseInt(monthRange.end.slice(8), 10) },
            ];
            return periods.map((p, idx) => {
                const amount = filteredStats.payments.filter(pay => {
                    const d = extractItemDateStr(pay);
                    if (!d || !d.startsWith(monthRange.monthPrefix)) return false;
                    const dayNum = parseInt(d.slice(8, 10), 10);
                    return dayNum >= p.from && dayNum <= p.to && (pay.amount > 0 || pay.type === 'INGRESO' || pay.type === 'VENTA');
                }).reduce((sum, pay) => sum + (parseFloat(pay.amount) || 0), 0);

                return { label: p.label, value: amount, color: idx % 2 === 0 ? 'var(--primary)' : 'var(--accent)' };
            });
        }

        if (dateRange === 'YEAR') {
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const yearStr = String(new Date().getFullYear());
            return months.map((l, idx) => {
                const pad = (n) => String(n).padStart(2, '0');
                const prefix = `${yearStr}-${pad(idx + 1)}`;
                const amount = (MOCK.payments || [])
                    .filter(p => extractItemDateStr(p).startsWith(prefix) && (p.amount > 0 || p.type === 'INGRESO' || p.type === 'VENTA'))
                    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                return { label: l, value: amount, color: 'var(--primary)' };
            });
        }

        // ALL - Últimos meses registrados
        return availableMonths.slice(0, 6).reverse().map((m, idx) => {
            const r = getMonthRange(m);
            const amount = (MOCK.payments || [])
                .filter(p => extractItemDateStr(p).startsWith(m) && (p.amount > 0 || p.type === 'INGRESO' || p.type === 'VENTA'))
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            return { label: r.label.slice(0, 3) + ' ' + r.year.toString().slice(2), value: amount, color: idx % 2 === 0 ? 'var(--primary)' : 'var(--accent)' };
        });
    }, [filteredStats.payments, dateRange, selectedMonth, weekRange, monthRange, MOCK.payments, availableMonths]);

    const maxChartVal = Math.max(...REVENUE_CHART.map(d => d.value), 100) * 1.2;

    return (
        <div className="page-content animate-fade-in">
            {/* Header con Filtros */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <SectionHeader icon="analytics" title="Inteligencia de Negocio" />
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 36, marginTop: -8 }}>
                        {dateRange === 'WEEK' && `Semana del ${weekRange.label} (Lunes a Domingo)`}
                        {dateRange === 'MONTH' && `Mes de ${monthRange.label} (del 01 al ${monthRange.end.slice(8)})`}
                        {dateRange === 'YEAR' && `Año calendario ${new Date().getFullYear()}`}
                        {dateRange === 'ALL' && 'Historial total acumulado'}
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {dateRange === 'MONTH' && (
                        <div className="glass-card" style={{ padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-surface)' }}>
                            <Icon name="calendar_month" size={16} style={{ color: 'var(--primary)' }} />
                            <select
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                {availableMonths.map(m => {
                                    const r = getMonthRange(m);
                                    return (
                                        <option key={m} value={m}>
                                            {r.label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}

                    <div className="glass-card" style={{ padding: '6px', display: 'flex', gap: 4, background: 'var(--bg-surface)' }}>
                        {[
                            { key: 'WEEK', label: 'Semana (Lun-Dom)' },
                            { key: 'MONTH', label: 'Mes (1 al último)' },
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
                        <ReportWidget icon="payments" label="Ingresos Totales" value={formatCurrency(filteredStats.ingresos)} sub="Ventas y servicios" trend={12} />
                        <ReportWidget icon="shopping_bag" label="Ticket Promedio" value={formatCurrency(filteredStats.ingresos / (filteredStats.workOrders.length || 1))} sub="Por orden de trabajo" trend={5} color="var(--accent)" />
                        <ReportWidget icon="account_balance_wallet" label="Utilidad Bruta" value={formatCurrency(filteredStats.ingresos - filteredStats.cogs)} sub="Post-insumos" trend={8} color="var(--success)" />
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
                        <ReportWidget icon="trending_up" label="Caja Real" value={formatCurrency(filteredStats.ingresos - filteredStats.gastos)} sub="Ingresos menos Egresos" color="var(--success)" />
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
                                        <strong style={{ color: 'var(--primary)' }}>{(parseFloat(stats.totalHours) || 0).toFixed(1)}h</strong>
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
