import React, { Fragment } from 'react';
import { formatCurrency, formatML } from '../data/data';
import { useApp } from '../context/AppContext';
import {
    StatCard,
    QueueCard,
    GlassCard,
    SectionHeader,
    StatusBadge,
    Icon
} from '../components/ui';

export const DashboardPage = () => {
    const { data: MOCK, getLowStockItems } = useApp();
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
                    <StatCard icon="payments" label="Caja del Día" value={formatCurrency(todayTotal)} sub="Cobros procesados hoy" tag="LIVE" barPercent={75} />
                    <StatCard icon="engineering" label="OTs Activas" value={activeOrders.length} sub={`${completedToday} finalizadas hoy`} tag="TALLER" barPercent={(activeOrders.length / 5) * 100} barAlert={activeOrders.length > 3} />
                    <StatCard icon="garage" label="Ocupación Boxes" value={`${boxOccupied}/${MOCK.boxes.length}`} sub="Capacidad de planta" barPercent={(boxOccupied / MOCK.boxes.length) * 100} />
                    <StatCard icon="inventory_2" label="Stock Crítico" value={lowStock.length} sub="Items bajo mínimo" tag="ALERTA" barPercent={lowStock.length > 0 ? 100 : 0} barAlert={lowStock.length > 0} />
                </div>

                {/* Main Grid — Queue + Sidebar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

                    {/* Service Queue */}
                    <div>
                        <SectionHeader icon="checklist_rtl" title="Cola de Trabajo" right={
                            <Fragment>
                                <button className="btn btn-sm btn-ghost"><Icon name="filter_alt" size={16} /> Filtrar</button>
                                <button className="btn btn-sm btn-primary"><Icon name="add" size={16} /> Nueva OT</button>
                            </Fragment>
                        } />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {MOCK.workOrders.slice(0, 5).map(wo => <QueueCard key={wo.id} wo={wo} />)}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Revenue Chart */}
                        <GlassCard style={{ padding: 22 }}>
                            <SectionHeader icon="trending_up" title="Ingresos Semanal" />
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color: 'var(--text-primary)' }}>
                                    {formatCurrency(MOCK.revenue.weekly_total)}
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>+8.2%</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                                Mes: {formatCurrency(MOCK.revenue.monthly_total)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
                                {MOCK.revenue.daily.map((d, i) => {
                                    const max = Math.max(...MOCK.revenue.daily.map(x => x.cash + x.transfer + x.card));
                                    const total = d.cash + d.transfer + d.card;
                                    const h = (total / max) * 100;
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                            <div style={{
                                                width: '100%', borderRadius: '4px 4px 0 0',
                                                background: `rgba(var(--primary-rgb), ${i === 4 ? '1' : '0.25'})`,
                                                height: h + '%', minHeight: 4,
                                                transition: 'height 0.6s ease'
                                            }} />
                                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{d.day}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>

                        {/* Inventory Alerts */}
                        <GlassCard style={{ padding: 22 }}>
                            <SectionHeader icon="notifications_active" title="Alertas de Stock" right={
                                lowStock.length > 0 ? <span className="nav-badge alert">{lowStock.length}</span> : null
                            } />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {lowStock.map(item => (
                                    <div key={item.id} style={{
                                        padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                                        background: 'rgba(var(--danger-rgb), 0.06)',
                                        border: '1px solid rgba(var(--danger-rgb), 0.1)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                                                Stock: <strong style={{ color: 'var(--danger)' }}>
                                                    {item.stock_type === 'VOLUME' ? formatML(item.stock_ml) : `${item.stock_quantity} uds`}
                                                </strong>
                                            </div>
                                        </div>
                                        <Icon name="warning" size={18} style={{ color: 'var(--danger)', opacity: 0.7 }} />
                                    </div>
                                ))}
                                {lowStock.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                                        <Icon name="check_circle" size={28} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                                        Stock en niveles óptimos
                                    </div>
                                )}
                            </div>
                        </GlassCard>

                        {/* Box Status */}
                        <GlassCard style={{ padding: 22 }}>
                            <SectionHeader icon="garage" title="Estado Boxes" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {MOCK.boxes.map(box => (
                                    <div key={box.id} style={{
                                        padding: 14, borderRadius: 'var(--radius)',
                                        background: box.status === 'Ocupado' ? 'rgba(var(--primary-rgb), 0.06)' : 'var(--bg-hover)',
                                        border: `1px solid ${box.status === 'Ocupado' ? 'rgba(var(--primary-rgb), 0.15)' : 'var(--border)'}`
                                    }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{box.name}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <div style={{
                                                width: 7, height: 7, borderRadius: '50%',
                                                background: box.status === 'Ocupado' ? 'var(--primary)' : 'var(--text-disabled)'
                                            }} />
                                            <span style={{
                                                fontSize: 11, fontWeight: 600,
                                                color: box.status === 'Ocupado' ? 'var(--primary)' : 'var(--text-muted)'
                                            }}>
                                                {box.status}
                                            </span>
                                        </div>
                                        {box.mechanic && (
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                                                <Icon name="person" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                                {box.mechanic}
                                            </div>
                                        )}
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
