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
    Icon,
    Modal,
    FormField,
    FormRow,
    LiquidGauge
} from '../components/ui';

export const DashboardPage = () => {
    const { data: MOCK, getLowStockItems, getActiveEmployees, processSale } = useApp();
    const { employees, user } = useAuth();

    // Oil Tank Related State
    const [selectedTank, setSelectedTank] = React.useState(null);
    const [sellAmount, setSellAmount] = React.useState('');
    const [sellLiters, setSellLiters] = React.useState('');
    const [paymentMethod, setPaymentMethod] = React.useState('EFECTIVO');
    const [posMode, setPosMode] = React.useState('DIRECT'); // 'DIRECT' or 'CART'
    const [combinedAmounts, setCombinedAmounts] = React.useState({ EFECTIVO: '', TRANSFERENCIA: '', TARJETA: '' });
    const [isProcessingSale, setIsProcessingSale] = React.useState(false);
    const activeOrders = MOCK.workOrders.filter(wo => wo.status !== 'Finalizado' && wo.status !== 'Cancelado');
    const completedToday = MOCK.workOrders.filter(wo => wo.status === 'Finalizado' && wo.completed_at?.startsWith(new Date().toLocaleDateString('en-CA'))).length;
    const lowStock = getLowStockItems();
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
    const todayPayments = (MOCK.payments || []).filter(p => (p.date || p.payment_date || p.created_at?.split('T')[0]) === todayStr && p.amount > 0);
    const todayTotal = todayPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

    const getRevenueStats = () => {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const monthlyPayments = (MOCK.payments || []).filter(p => (p.date || p.payment_date || p.created_at)?.startsWith(todayStr.slice(0, 7)));
        const monthlyTotal = monthlyPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

        const last7Days = (MOCK.payments || []).filter(p => {
            const pDate = new Date(p.date || p.created_at);
            const diff = (new Date() - pDate) / (1000 * 3600 * 24);
            return diff <= 7;
        });
        const weeklyTotal = last7Days.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

        // Agrupar por día para el gráfico (últimos 5 días hábiles aprox)
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const dailyStats = [0, 1, 2, 3, 4, 5, 6].map(dIdx => {
            const dayName = days[dIdx];
            const amount = (MOCK.payments || [])
                .filter(p => new Date(p.date || p.created_at).getDay() === dIdx)
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            return { day: dayName, total: amount };
        }).filter(d => d.day !== 'Dom' && d.day !== 'Sáb'); // Solo lunes a viernes para el mini-gráfico

        return {
            daily: dailyStats.map(d => ({ ...d, cash: d.total })),
            weekly_total: weeklyTotal,
            monthly_total: monthlyTotal
        };
    };
    const revenue = getRevenueStats();

    const getBoxStatus = (boxId) => {
        const order = activeOrders.find(wo => wo.box_id === boxId && wo.status === 'En Box');
        if (order) {
            // Buscar mecánico por assignments (sistema actual) o fallback a mechanic_id (legacy)
            const assignment = (MOCK.assignments || []).find(a => a.work_order_id === order.id);
            const mechanicName = assignment
                ? employees.find(e => e.id === assignment.mechanic_id)?.name
                : employees.find(e => e.id === order.mechanic_id)?.name;
            return { status: 'Ocupado', mechanic: mechanicName || 'Asignado' };
        }
        return { status: 'Libre', mechanic: null };
    };

    const boxOccupied = MOCK.boxes.filter(b => getBoxStatus(b.id).status === 'Ocupado').length;

    if (user.role === 'limpieza') {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ textAlign: 'center', maxWidth: 400 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                        <Icon name="cleaning_services" size={40} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h2 style={{ fontSize: 24, marginBottom: 8 }}>Hola, {user.name}</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Tu acceso está limitado solo al fichaje de horas. Por favor, usá el botón superior para registrar tu entrada o salida.</p>
                    <div style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                        <Icon name="info" size={20} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                        <div style={{ fontSize: 13 }}>Tu jornada se registra automáticamente al fichar.</div>
                    </div>
                </div>
            </div>
        );
    }

    const oilTanks = (MOCK.inventory || []).filter(i => i.stock_type === 'VOLUME');

    const handleQuickSell = async (type, val) => {
        if (!selectedTank) return;
        setIsProcessingSale(true);
        try {
            let liters = 0;
            if (type === 'PRESET') {
                liters = val;
            } else if (type === 'MONTO') {
                const monto = parseFloat(sellAmount);
                if (!monto || monto <= 0) throw new Error("Monto inválido");
                liters = monto / selectedTank.sell_price;
            } else if (type === 'LITROS') {
                liters = parseFloat(sellLiters);
                if (!liters || liters <= 0) throw new Error("Cantidad de litros inválida");
            }

            // check stock
            if ((selectedTank.stock_ml / 1000) < liters) {
                throw new Error("No hay suficiente aceite en el tanque");
            }

            // Determine final liters and price
            let finalLiters = liters;
            let finalPrice = liters * selectedTank.sell_price;

            if (posMode === 'CART') {
                addToPosCart({
                    id: selectedTank.id,
                    label: selectedTank.name,
                    price: selectedTank.sell_price,
                    qty: finalLiters,
                    inventory_item: selectedTank
                });
                alert('Producto añadido al carrito del punto de venta.');
                setSelectedTank(null);
                setSellAmount('');
                setSellLiters('');
                return;
            }

            // Direct Sale
            await addQuickService(
                { label: selectedTank.name, price: finalPrice, qty: finalLiters, id: selectedTank.id, inventory_item: selectedTank },
                null, null, null,
                { method: paymentMethod, combinedAmounts: paymentMethod === 'COMBINADO' ? combinedAmounts : null }
            );

            alert(`Venta registrada correctamente por ${formatCurrency(finalPrice)} (${paymentMethod})`);
            setSelectedTank(null);
            setSellAmount('');
            setSellLiters('');
        } catch (e) {
            console.error("Quick sell error", e);
            alert("Error en venta rápida: " + e.message);
        } finally {
            setIsProcessingSale(false);
        }
    };

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

                {/* Oil Tanks Grid */}
                {oilTanks.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <SectionHeader icon="opacity" title="Tanques de Aceite (Suelto)" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                            {oilTanks.map(tank => {
                                const capacity = tank.container_size_ml || 50000;
                                const percent = (tank.stock_ml / capacity) * 100;
                                return (
                                    <GlassCard key={tank.id} style={{ padding: 16, cursor: 'pointer', transition: 'transform 0.2s' }}
                                        onClick={() => setSelectedTank(tank)}
                                        className="tank-card"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 60, height: 80 }}>
                                                <LiquidGauge current_ml={tank.stock_ml} max_ml={capacity} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{tank.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tank.brand}</div>
                                                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                                                    {formatCurrency(tank.sell_price)} / L
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Grid — Queue + Sidebar */}
                <div className="grid-sidebar">

                    {/* Service Queue */}
                    <div>
                        <SectionHeader icon="checklist_rtl" title="Cola de Trabajo" right={
                            <button className="btn btn-sm btn-ghost"><Icon name="filter_alt" size={16} /> Filtrar</button>
                        } />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {activeOrders.slice(0, 5).map(wo => {
                                const clientName = wo.clients ? `${wo.clients.first_name} ${wo.clients.last_name}` : 'Cliente';
                                const vehicleName = wo.vehicles ? `${wo.vehicles.license_plate} - ${wo.vehicles.brand}` : 'Vehículo';
                                const assignment = (MOCK.assignments || []).find(a => a.work_order_id === wo.id);
                                const mechanicName = assignment
                                    ? employees.find(e => e.id === assignment.mechanic_id)?.name
                                    : employees.find(e => e.id === wo.mechanic_id)?.name || 'Sin Asignar';
                                const boxName = MOCK.boxes.find(b => b.id === wo.box_id)?.name || 'Sin Box';

                                return <QueueCard key={wo.id} wo={{ ...wo, client: clientName, vehicle: vehicleName, mechanic: mechanicName, box: boxName }} />;
                            })}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Revenue Chart - Solo Admins */}
                        {user?.role === 'admin' && (
                            <GlassCard style={{ padding: 22 }}>
                                <SectionHeader icon="trending_up" title="Ingresos Semanal" />
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                                    <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color: 'var(--text-primary)' }}>
                                        {formatCurrency(revenue.weekly_total)}
                                    </div>
                                    <span>Semanal</span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                                    Mes: {formatCurrency(revenue.monthly_total)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70 }}>
                                    {revenue.daily.map((d, i) => {
                                        const max = Math.max(...revenue.daily.map(x => x.cash || 0));
                                        const total = d.cash || 0;
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
                        )}

                        {/* Integridad Operativa - Solo Admins */}
                        {user?.role === 'admin' && (
                            <GlassCard style={{ padding: 22 }}>
                                <SectionHeader icon="verified_user" title="Integridad Operativa" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {/* Detectar Cierres Olvidados */}
                                    {(() => {
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        const pendingOld = (MOCK.payments || []).filter(p => !p.cash_closing_id && p.date < todayStr);
                                        if (pendingOld.length === 0) return null;
                                        return (
                                            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(var(--danger-rgb), 0.1)', border: '1px solid rgba(var(--danger-rgb), 0.2)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontWeight: 700, fontSize: 13 }}>
                                                    <Icon name="warning" size={16} /> CIERRE PENDIENTE
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-primary)', marginTop: 4 }}>
                                                    Hay movimientos de días anteriores sin cerrar. 
                                                    <strong> {pendingOld.length} transacciones</strong> en limbo.
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Detectar Fichajes sin Salida (más de 16hs) */}
                                    {(() => {
                                        const active = getActiveEmployees();
                                        const forbidden = active.filter(emp => {
                                            const since = new Date(emp.since_raw);
                                            const diffMs = new Date() - since;
                                            return diffMs > 16 * 60 * 60 * 1000; // 16 hs
                                        });
                                        if (forbidden.length === 0) return null;
                                        return (
                                            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(var(--warning-rgb), 0.1)', border: '1px solid rgba(var(--warning-rgb), 0.2)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warning)', fontWeight: 700, fontSize: 13 }}>
                                                    <Icon name="history" size={16} /> SALIDA PENDIENTE
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--text-primary)', marginTop: 4 }}>
                                                    {forbidden.length} empleados no marcaron salida ayer:
                                                    <strong> {forbidden.map(f => f.name).join(', ')}</strong>.
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Salud de Sincronización */}
                                    {(() => {
                                        const offlineQueue = JSON.parse(localStorage.getItem('piripi_audit_queue') || '[]');
                                        const isOnline = navigator.onLine;
                                        return (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                                                <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Icon name={isOnline ? 'cloud_done' : 'cloud_off'} size={16} style={{ color: isOnline ? 'var(--success)' : 'var(--danger)' }} />
                                                    Sincronización
                                                </div>
                                                <div style={{ fontSize: 11, fontWeight: 700 }}>
                                                    {offlineQueue.length > 0 ? `${offlineQueue.length} pendiente` : 'Al día'}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    
                                    {/* Todo OK info */}
                                    {(() => {
                                        const todayStr = new Date().toISOString().split('T')[0];
                                        const pendingOld = (MOCK.payments || []).filter(p => !p.cash_closing_id && p.date < todayStr);
                                        const active = getActiveEmployees();
                                        const forbidden = active.filter(emp => (new Date() - new Date(emp.since_raw)) > 16 * 60 * 60 * 1000);
                                        
                                        if (pendingOld.length === 0 && forbidden.length === 0) {
                                            return (
                                                <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'var(--success)', background: 'rgba(var(--success-rgb), 0.05)', borderRadius: 8 }}>
                                                    <Icon name="check_circle" size={18} style={{ marginBottom: 4 }} />
                                                    <div style={{ fontWeight: 600 }}>Trazabilidad Correcta</div>
                                                    <div style={{ fontSize: 10, opacity: 0.8 }}>No hay omisiones detectadas hoy.</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </GlassCard>
                        )}

                        {/* Personal Activo - Solo Admins */}
                        {user?.role === 'admin' && (
                            <GlassCard style={{ padding: 22 }}>
                                <SectionHeader icon="badge" title="Personal Activo" right={
                                    <span className="nav-badge" style={{ background: 'var(--success)', color: 'white' }}>LIVE</span>
                                } />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {getActiveEmployees().map(emp => (
                                        <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-hover)', borderRadius: 8 }}>
                                            <div>
                                                <div style={{ fontSize: 13, fontWeight: 700 }}>{emp.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Desde: {emp.since}</div>
                                            </div>
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                                        </div>
                                    ))}
                                    {getActiveEmployees().length === 0 && (
                                        <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>No hay personal fichado actualmente.</div>
                                    )}
                                </div>
                            </GlassCard>
                        )}

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
                                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{box.name}</div>
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

            {/* Modal Venta Rápida Aceite */}
            {selectedTank && (
                <Modal title={`Vender Aceite: ${selectedTank.name}`} onClose={() => setSelectedTank(null)} footer={
                    <button className="btn btn-ghost" onClick={() => setSelectedTank(null)}>Cerrar</button>
                }>
                    <div style={{ padding: 20 }}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>Precio por Litro</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(selectedTank.sell_price)}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
                            <button className="btn btn-outline" onClick={() => handleQuickSell('PRESET', 0.25)} disabled={isProcessingSale}>
                                250 ml
                            </button>
                            <button className="btn btn-outline" onClick={() => handleQuickSell('PRESET', 0.5)} disabled={isProcessingSale}>
                                500 ml
                            </button>
                            <button className="btn btn-outline" onClick={() => handleQuickSell('PRESET', 1)} disabled={isProcessingSale}>
                                1 Litro
                            </button>
                        </div>

                        <div className="divider" style={{ marginBottom: 24 }}>O elegir monto / cantidad</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormRow>
                                <FormField label="Vender por Monto ($)">
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Ej: 2000"
                                            value={sellAmount}
                                            onChange={e => setSellAmount(e.target.value)}
                                        />
                                    </div>
                                </FormField>
                            </FormRow>

                            <FormRow>
                                <FormField label="Vender por Litros (L)">
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Ej: 0.75"
                                            value={sellLiters}
                                            onChange={e => setSellLiters(e.target.value)}
                                        />
                                    </div>
                                </FormField>
                            </FormRow>

                            <div className="divider">Opciones de Venta</div>

                            <FormRow>
                                <FormField label="Modo">
                                    <div className="btn-group">
                                        <button className={`btn btn-sm ${posMode === 'DIRECT' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPosMode('DIRECT')}>Venta Directa</button>
                                        <button className={`btn btn-sm ${posMode === 'CART' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPosMode('CART')}>Ir al Carrito</button>
                                    </div>
                                </FormField>
                            </FormRow>

                            {posMode === 'DIRECT' && (
                                <Fragment>
                                    <FormRow>
                                        <FormField label="Medio de Pago">
                                            <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                                <option value="EFECTIVO">EFECTIVO</option>
                                                <option value="DEBITO">DÉBITO</option>
                                                <option value="CREDITO">CRÉDITO</option>
                                                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                                <option value="COMBINADO">COMBINADO</option>
                                            </select>
                                        </FormField>
                                    </FormRow>

                                    {paymentMethod === 'COMBINADO' && (
                                        <div style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            <input type="number" className="form-input btn-sm" placeholder="Efectivo" value={combinedAmounts.EFECTIVO} onChange={e => setCombinedAmounts({ ...combinedAmounts, EFECTIVO: e.target.value })} />
                                            <input type="number" className="form-input btn-sm" placeholder="Tarjeta" value={combinedAmounts.TARJETA} onChange={e => setCombinedAmounts({ ...combinedAmounts, TARJETA: e.target.value })} />
                                            <input type="number" className="form-input btn-sm" placeholder="Transf." value={combinedAmounts.TRANSFERENCIA} onChange={e => setCombinedAmounts({ ...combinedAmounts, TRANSFERENCIA: e.target.value })} />
                                        </div>
                                    )}
                                </Fragment>
                            )}

                            <button
                                className={`btn ${posMode === 'CART' ? 'btn-warning' : 'btn-primary'} btn-lg`}
                                style={{ marginTop: 20 }}
                                onClick={() => handleQuickSell(sellAmount ? 'MONTO' : 'LITROS')}
                                disabled={isProcessingSale || (!sellAmount && !sellLiters)}
                            >
                                <Icon name={posMode === 'CART' ? 'add_shopping_cart' : 'point_of_sale'} size={20} />
                                {posMode === 'CART' ? 'Agregar al Carrito' : 'Finalizar Venta Directa'}
                            </button>
                        </div>

                        {sellAmount && selectedTank && (
                            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-hover)', borderRadius: 8, fontSize: 13, textAlign: 'center' }}>
                                Equivalente a: <strong>{(parseFloat(sellAmount) / selectedTank.sell_price).toFixed(3)} L</strong>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};
