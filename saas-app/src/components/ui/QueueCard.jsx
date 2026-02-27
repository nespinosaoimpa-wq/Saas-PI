import React from 'react';
import { MOCK, getClient, getVehicle, formatCurrency } from '../../data/data';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';

export const QueueCard = ({ wo, onClick }) => {
    const client = getClient(wo.client_id);
    const vehicle = getVehicle(wo.vehicle_id);
    const box = MOCK.boxes.find(b => b.id === wo.box_id);
    return (
        <div className="queue-card" onClick={onClick}>
            <div className="queue-card-left">
                <div className="queue-bay">
                    <small>{box ? 'BOX' : 'COLA'}</small>
                    <strong>{box ? box.name.replace('Box ', '') : 'â€”'}</strong>
                </div>
                <div className="queue-info">
                    <h4>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'VehÃ­culo'} â€” {wo.description}</h4>
                    <p>OT #{wo.order_number} â€¢ {client ? `${client.first_name} ${client.last_name}` : ''} â€¢ {vehicle?.license_plate}</p>
                </div>
            </div>
            <div className="queue-card-right">
                <div className="queue-meta"><label>Estado</label><StatusBadge status={wo.status} /></div>
                {wo.total_price > 0 && <div className="queue-meta"><label>Total</label><span style={{ color: 'var(--primary)' }}>{formatCurrency(wo.total_price)}</span></div>}
                <button className="btn btn-icon btn-ghost" style={{ width: 32, height: 32 }}><Icon name="more_vert" size={18} /></button>
            </div>
        </div>
    );
};
