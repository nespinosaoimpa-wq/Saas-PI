import React from 'react';
import { formatCurrency } from '../../data/data';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';

export const QueueCard = ({ wo, onClick, rightAction, onViewVehicle }) => {
    const { data: MOCK, getClient, getVehicle } = useApp();
    const client = getClient(wo.client_id);
    const vehicle = getVehicle(wo.vehicle_id);
    const box = MOCK.boxes.find(b => b.id === wo.box_id);

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diffMs = new Date() - new Date(dateStr);
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (diffHrs > 24) return `hace ${Math.floor(diffHrs / 24)} días`;
        if (diffHrs > 0) return `hace ${diffHrs}h ${diffMins}m`;
        return `hace ${diffMins} min`;
    };

    const entryTime = wo.created_at ? new Date(wo.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '';
    const timeAgo = getTimeAgo(wo.created_at);

    return (
        <div className="queue-card" onClick={onClick}>
            <div className="queue-card-left">
                <div className="queue-bay">
                    <small>{box ? 'BOX' : 'COLA'}</small>
                    <strong>{box ? (box.name || '').replace('Box ', '') : '—'}</strong>
                </div>
                <div className="queue-info">
                    <h4>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehículo'} — {wo.description}</h4>
                    <p style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                        <span>OT #{wo.order_number}</span>
                        <span>•</span>
                        <span>{client ? `${client.first_name} ${client.last_name}` : ''}</span>
                        <span>•</span>
                        <span
                            style={{ background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontWeight: 600 }}
                            onClick={(e) => { e.stopPropagation(); if (onViewVehicle && vehicle) onViewVehicle(vehicle); }}
                            title="Ver Ficha Histórica del Vehículo"
                        >
                            <Icon name="history" size={14} />
                            {vehicle?.license_plate}
                        </span>
                        <span>•</span>
                        <span style={{ color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="schedule" size={14} />
                            Ingresó {timeAgo} ({entryTime})
                        </span>
                    </p>
                </div>
            </div>
            <div className="queue-card-right">
                <div className="queue-meta"><label>Estado</label><StatusBadge status={wo.status} /></div>
                {wo.total_price > 0 && <div className="queue-meta"><label>Total</label><span style={{ color: 'var(--primary)' }}>{formatCurrency(wo.total_price)}</span></div>}
                {rightAction || <button className="btn btn-icon btn-ghost" style={{ width: 32, height: 32 }}><Icon name="more_vert" size={18} /></button>}
            </div>
        </div>
    );
};
