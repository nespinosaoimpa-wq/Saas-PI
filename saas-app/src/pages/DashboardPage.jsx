import React, { Fragment } from 'react';
import { MOCK, formatCurrency, formatML, getLowStockItems } from '../data/data';
import {
    StatCard,
    QueueCard,
    GlassCard,
    SectionHeader,
    StatusBadge,
    Icon
} from '../components/ui';

export const DashboardPage = () => {
    const activeOrders = MOCK.workOrders.filter(wo => wo.status !== 'Finalizado' && wo.status !== 'Cancelado');
    const completedToday = MOCK.workOrders.filter(wo => wo.status === 'Finalizado' && wo.completed_at?.startsWith('2026-02-2')).length;
    const lowStock = getLowStockItems();
    const todayPayments = MOCK.payments.filter(p => p.date === '2026-02-27');
    const todayTotal = todayPayments.reduce((s, p) => s + p.amount, 0);
    const boxOccupied = MOCK.boxes.filter(b => b.status === 'Ocupado').length;

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                {/* KPI Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                    <StatCard icon="payments" label="FacturaciÃ³n Hoy" value={formatCurrency(todayTotal)} sub="2 cobros registrados" tag="24H" barPercent={65} />
                    <StatCard icon="build" label="OTs Activas" value={activeOrders.length} sub={`${completedToday} finalizadas hoy`} tag="Live" barPercent={(activeOrders.length / 4) * 100} barAlert />
                    <StatCard icon="garage" label="Boxes Ocupados" value={`${boxOccupied}/${MOCK.boxes.length}`} sub={boxOccupied < MOCK.boxes.length ? 'Hay boxes disponibles' : 'Todos ocupados'} barPercent={(boxOccupied / MOCK.boxes.length) * 100} />
                    <StatCard icon="inventory_2" label="Stock" value={`${MOCK.inventory.length - lowStock.length}/${MOCK.inventory.length}`} sub={lowStock.length > 0 ? `âš  ${lowStock.length} items bajo mÃ­nimo` : 'Todo OK'} barPercent={((MOCK.inventory.length - lowStock.length) / MOCK.inventory.length) * 100} barAlert={lowStock.length > 0} />
                </div>

                {/* Main grid: Queue + Sidebar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                    {/* Service Queue */}
                    <div>
                        <SectionHeader icon="checklist_rtl" title="Cola de Servicio Activa" right={
                            <Fragment>
                                <button className="btn btn-sm btn-ghost"><Icon name="filter_list" size={16} /> Filtrar</button>
                            </Fragment>
                        } />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {MOCK.workOrders.slice(0, 4).map(wo => <QueueCard key={wo.id} wo={wo} />)}
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Revenue Chart */}
                        <GlassCard style={{ padding: 20 }}>
                            <SectionHeader icon="bar_chart" title="Ingresos Semanal" />
                            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>{formatCurrency(MOCK.revenue.weekly_total)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Mes: {formatCurrency(MOCK.revenue.monthly_total)}</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                                {MOCK.revenue.daily.map((d, i) => {
                                    const max = Math.max(...MOCK.revenue.daily.map(x => x.cash + x.transfer + x.card));
                                    const total = d.cash + d.transfer + d.card;
                                    const h = (total / max) * 100;
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: i === 4 ? 'var(--primary)' : 'rgba(13,242,242,0.25)', height: h + '%', minHeight: 4, transition: 'height 0.5s' }} />
                                            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{d.day}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>

                        {/* Low Stock Alerts */}
                        <GlassCard style={{ padding: 20 }}>
                            <SectionHeader icon="warning" title="Alertas Stock" right={
                                <span className="nav-badge alert">{lowStock.length}</span>
                            } />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {lowStock.map(item => (
                                    <div key={item.id} className="neon-border-left" style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(255,51,102,0.05)', borderLeft: '3px solid var(--danger)' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {item.stock_type === 'VOLUME'
                                                ? `${formatML(item.stock_ml)} / mÃ­n. ${formatML(item.stock_min_ml)}`
                                                : `${item.stock_quantity} uds / mÃ­n. ${item.stock_min}`
                                            }
                                        </div>
                                    </div>
                                ))}
                                {lowStock.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 16, textAlign: 'center' }}>Sin alertas</div>}
                            </div>
                        </GlassCard>

                        {/* Box Status */}
                        <GlassCard style={{ padding: 20 }}>
                            <SectionHeader icon="garage" title="Estado Boxes" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {MOCK.boxes.map(box => (
                                    <div key={box.id} style={{ padding: 12, borderRadius: 8, background: box.status === 'Ocupado' ? 'rgba(13,242,242,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${box.status === 'Ocupado' ? 'rgba(13,242,242,0.2)' : 'var(--border)'}` }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{box.name}</div>
                                        <StatusBadge status={box.status === 'Ocupado' ? 'En Box' : box.status} />
                                        {box.mechanic && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{box.mechanic}</div>}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
};
