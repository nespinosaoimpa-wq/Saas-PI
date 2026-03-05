import React from 'react';
import { formatCurrency, MOCK as STATIC_MOCK } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SectionHeader, GlassCard, StatusBadge, CheckItem, Icon } from '../components/ui';

export const DailyWorkPage = () => {
    const { data: MOCK, getClient, getVehicle, updateWorkOrder, getCommissions } = useApp();
    const { user } = useAuth();
    const myOrders = MOCK.workOrders.filter(wo => wo.status === 'En Box');
    const commissions = user ? getCommissions(user.id) : 0;

    const handleFinishOrder = (id) => {
        if (window.confirm('¿Confirmar finalización del trabajo?')) {
            updateWorkOrder(id, { status: 'Finalizado', completed_at: new Date().toISOString() });
        }
    };

    const QUICK_ACTIONS = [
        { id: 'qa1', label: 'Parche Moto', icon: 'tire_repair', price: 2500, color: 'var(--primary)' },
        { id: 'qa2', label: 'Parche Auto', icon: 'tire_repair', price: 3500, color: 'var(--primary)' },
        { id: 'qa3', label: 'Inflado / Aire', icon: 'air', price: 0, color: 'var(--success)' },
        { id: 'qa4', label: 'Ajuste Cadena', icon: 'settings_suggest', price: 1500, color: 'var(--warning)' },
        { id: 'qa5', label: 'Lubric. Cadena', icon: 'oil_barrel', price: 1000, color: 'var(--accent)' },
        { id: 'qa6', label: 'Repar. Cámara', icon: 'build', price: 2800, color: 'var(--danger)' },
    ];

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
                {/* My Orders */}
                <div>
                    <SectionHeader icon="engineering" title="Mis Trabajos: Órdenes Activas" right={
                        <span className="nav-badge alert">{myOrders.length} ACTIVOS</span>
                    } />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {myOrders.map(wo => {
                            const client = getClient(wo.client_id);
                            const vehicle = getVehicle(wo.vehicle_id);
                            return (
                                <GlassCard key={wo.id} style={{ padding: 24, borderLeft: '4px solid var(--primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                                                ORDEN DE TRABAJO #{wo.order_number}
                                            </div>
                                            <h4 style={{ fontSize: 18, fontWeight: 800 }}>{vehicle?.brand} {vehicle?.model}</h4>
                                            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                                                {vehicle?.license_plate} • {client?.first_name} {client?.last_name}
                                            </p>
                                        </div>
                                        <StatusBadge status={wo.status} />
                                    </div>

                                    <div style={{ background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-sm)', marginBottom: 16, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>Trabajo a realizar:</div>
                                        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>{wo.description}</p>
                                    </div>

                                    <SectionHeader icon="checklist" title="Control de Tareas" />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                                        {(STATIC_MOCK.checklist_template || []).slice(0, 6).map(item => (
                                            <CheckItem key={item.key} label={item.label} sub={item.group} />
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn btn-success" style={{ flex: 1, height: 46, fontSize: 14, fontWeight: 700 }} onClick={() => handleFinishOrder(wo.id)}>
                                            <Icon name="check_circle" size={20} /> FINALIZAR TRABAJO
                                        </button>
                                        <button className="btn btn-ghost" style={{ width: 46, height: 46, padding: 0, justifyContent: 'center' }}>
                                            <Icon name="photo_camera" size={20} />
                                        </button>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>
                </div>

                {/* Gomería — Quick Services */}
                <div>
                    <SectionHeader icon="tire_repair" title="Gomería: Registro Rápido" right={
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>MÓDULO EXPRESS</span>
                    } />
                    <div className="glass-card" style={{ padding: 20 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Clic para registrar un servicio inmediato sin OT.
                        </p>

                        <div className="quick-action-grid">
                            {QUICK_ACTIONS.map(action => (
                                <div key={action.id} className="quick-action-card" onClick={() => alert(`Servicio rápido: ${action.label} — ${formatCurrency(action.price)}`)}>
                                    <Icon name={action.icon} size={28} style={{ color: action.color, marginBottom: 8 }} />
                                    <div className="quick-action-label">{action.label}</div>
                                    <div style={{ fontSize: 11, color: action.price > 0 ? 'var(--text-primary)' : 'var(--success)', fontWeight: 700, marginTop: 4 }}>
                                        {action.price > 0 ? formatCurrency(action.price) : 'GRATIS'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 20, padding: 14, background: 'rgba(var(--primary-rgb), 0.04)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Icon name="history" style={{ color: 'var(--primary)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>Actividad Reciente</div>
                                    {(MOCK.activityLog || []).length > 0 ? (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {MOCK.activityLog[0].label} — {formatCurrency(MOCK.activityLog[0].price)} (Ahora)
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sin actividad reciente</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ marginTop: 16, padding: 20 }}>
                        <SectionHeader icon="payments" title="Mis Comisiones" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: 28, fontWeight: 800 }}>{formatCurrency(commissions)}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Acumulado este mes</div>
                            </div>
                            <button className="btn btn-sm btn-ghost">Detalle</button>
                        </div>
                        <div className="stat-bar" style={{ height: 5, marginTop: 14 }}>
                            <div className="stat-bar-fill" style={{ width: '65%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
