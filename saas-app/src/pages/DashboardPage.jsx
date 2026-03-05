import React, { Fragment } from 'react';
import { formatCurrency, formatML } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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
    const { employees } = useAuth();
    const activeOrders = MOCK.workOrders.filter(wo => wo.status !== 'Finalizado' && wo.status !== 'Cancelado');
    const completedToday = MOCK.workOrders.filter(wo => wo.status === 'Finalizado' && wo.completed_at?.startsWith(new Date().toISOString().split('T')[0])).length;
    const lowStock = getLowStockItems();
    const todayPayments = MOCK.payments.filter(p => p.date === new Date().toISOString().split('T')[0]);
    const todayTotal = todayPayments.reduce((s, p) => s + p.amount, 0);

    const getRevenueStats = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const monthlyTotal = MOCK.payments.filter(p => p.date?.startsWith(todayStr.slice(0, 7))).reduce((s, p) => s + p.amount, 0);
        const weeklyTotal = MOCK.payments.filter(p => {
            const date = new Date(p.date);
            return (Date.now() - date.getTime()) / (1000 * 3600 * 24) <= 7;
        }).reduce((s, p) => s + p.amount, 0);

        const daily = [
            { day: 'Lun', cash: 0, transfer: 0, card: 0 },
            { day: 'Mar', cash: 0, transfer: 0, card: 0 },
            { day: 'Mié', cash: 0, transfer: 0, card: 0 },
            { day: 'Jue', cash: 0, transfer: 0, card: 0 },
            { day: 'Vie', cash: todayTotal, transfer: 0, card: 0 },
        ];
        return { daily, weekly_total: weeklyTotal, monthly_total: monthlyTotal };
    };
    const revenue = getRevenueStats();

    const getBoxStatus = (boxId) => {
        const order = activeOrders.find(wo => wo.box_id === boxId && wo.status === 'En Box');
        if (order) {
            return { status: 'Ocupado', mechanic: employees.find(e => e.id === order.mechanic_id)?.name || 'Asignado' };
        }
        return { status: 'Libre', mechanic: null };
    };

    const boxOccupied = MOCK.boxes.filter(b => getBoxStatus(b.id).status === 'Ocupado').length;

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                {/* KPI Row */}
                <div className="grid-stats">
                    <StatCard icon="payments" label="Caja del Día" value={formatCurrency(todayTotal)} sub="Cobros procesados hoy" tag="LIVE" barPercent={75} />
                    <StatCard icon="engineering" label="OTs Activas" value={activeOrders.length} sub={`${completedToday} finalizadas hoy`} tag="TALLER" barPercent={(activeOrders.length / 5) * 100} barAlert={activeOrders.length > 3} />
                    <StatCard icon="garage" label="Ocupación Boxes" value={`${boxOccupied}/${MOCK.boxes.length}`} sub="Capacidad de planta" barPercent={(boxOccupied / MOCK.boxes.length) * 100} />
                    <StatCard icon="inventory_2" label="Stock Crítico" value={lowStock.length} sub="Items bajo mínimo" tag="ALERTA" barPercent={lowStock.length > 0 ? 100 : 0} barAlert={lowStock.length > 0} />
                </div>

                {/* Main Grid — Queue + Sidebar */}
                <div className="grid-sidebar">

                    {/* Service Queue */}
                    <div>
                        <SectionHeader icon="checklist_rtl" title="Cola de Trabajo" right={
                            <Fragment>
                                <button className="btn btn-sm btn-ghost"><Icon name="filter_alt" size={16} /> Filtrar</button>
                                <button className="btn btn-sm btn-primary"><Icon name="add" size={16} /> Nueva OT</button>
                            </Fragment>
                        } />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {activeOrders.slice(0, 5).map(wo => {
                                const clientName = wo.clients ? `${wo.clients.first_name} ${wo.clients.last_name}` : 'Cliente';
                                const vehicleName = wo.vehicles ? `${wo.vehicles.license_plate} - ${wo.vehicles.brand}` : 'Vehículo';
                                const mechanicName = employees.find(e => e.id === wo.mechanic_id)?.name || 'Sin Asignar';
                                const boxName = MOCK.boxes.find(b => b.id === wo.box_id)?.name || 'Sin Box';

                                return <QueueCard key={wo.id} wo={{ ...wo, client: clientName, vehicle: vehicleName, mechanic: mechanicName, box: boxName }} />;
                            })}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Revenue Chart */}
                        <GlassCard style={{ padding: 22 }}>
                            <SectionHeader icon="trending_up" title="Ingresos Semanal" />
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color: 'var(--text-primary)' }}>
                                    {formatCurrency(revenue.weekly_total)}
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>+8.2%</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                                Mes: {formatCurrency(revenue.monthly_total)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
                                {revenue.daily.map((d, i) => {
                                    const max = Math.max(...revenue.daily.map(x => x.cash + x.transfer + x.card));
                                    const total = d.cash + d.transfer + d.card;
                                    const h = max > 0 ? (total / max) * 100 : (i === 4 ? 20 : 0);
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
                            <div className="grid-2col-even">
                                {MOCK.boxes.map(box => {
                                    const bStat = getBoxStatus(box.id);
                                    return (
                                        <div key={box.id} style={{
                                            padding: 14, borderRadius: 'var(--radius)',
                                            background: bStat.status === 'Ocupado' ? 'rgba(var(--primary-rgb), 0.06)' : 'var(--bg-hover)',
                                            border: `1px solid ${bStat.status === 'Ocupado' ? 'rgba(var(--primary-rgb), 0.15)' : 'var(--border)'}`
                                        }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{box.name} ({box.type})</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{
                                                    width: 7, height: 7, borderRadius: '50%',
                                                    background: bStat.status === 'Ocupado' ? 'var(--primary)' : 'var(--text-disabled)'
                                                }} />
                                                <span style={{
                                                    fontSize: 11, fontWeight: 600,
                                                    color: bStat.status === 'Ocupado' ? 'var(--primary)' : 'var(--text-muted)'
                                                }}>
                                                    {bStat.status}
                                                </span>
                                            </div>
                                            {bStat.mechanic && (
                                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                                                    <Icon name="person" size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                                    {bStat.mechanic}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
};
