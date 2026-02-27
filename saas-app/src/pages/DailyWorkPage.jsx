import React from 'react';
import { MOCK, getClient, getVehicle } from '../data/data';
import { SectionHeader, GlassCard, StatusBadge, CheckItem, Icon } from '../components/ui';

export const DailyWorkPage = () => {
    const myOrders = MOCK.workOrders.filter(wo => wo.status === 'En Box');
    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <SectionHeader icon="engineering" title="Mis Trabajos de Hoy" right={
                    <span className="nav-badge alert">{myOrders.length} activos</span>
                } />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {myOrders.map(wo => {
                        const client = getClient(wo.client_id);
                        const vehicle = getVehicle(wo.vehicle_id);
                        return (
                            <GlassCard key={wo.id} style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                    <div>
                                        <h4 style={{ fontSize: 18, fontWeight: 700 }}>OT #{wo.order_number}</h4>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{vehicle?.brand} {vehicle?.model} â€¢ {vehicle?.license_plate} â€¢ {client?.first_name} {client?.last_name}</p>
                                    </div>
                                    <StatusBadge status={wo.status} />
                                </div>
                                <p style={{ fontSize: 14, marginBottom: 16 }}>{wo.description}</p>
                                <SectionHeader icon="checklist" title="Checklist RÃ¡pido" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    {MOCK.checklist_template.slice(0, 6).map(item => (
                                        <CheckItem key={item.key} label={item.label} sub={item.group} />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                    <button className="btn btn-primary" style={{ flex: 1, padding: 14, fontSize: 15 }}><Icon name="check_circle" size={20} /> Marcar Finalizado</button>
                                    <button className="btn btn-ghost" style={{ padding: 14 }}><Icon name="qr_code_scanner" size={20} /></button>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
