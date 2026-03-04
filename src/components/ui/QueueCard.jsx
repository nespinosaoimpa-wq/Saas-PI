import React from 'react';
import { formatCurrency } from '../../data/data';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { Icon } from './Icon';

export const QueueCard = ({ wo, onClick }) => {
    const { data: MOCK, getClient, getVehicle } = useApp();
    const client = getClient(wo.client_id);
    const vehicle = getVehicle(wo.vehicle_id);
    const box = MOCK.boxes.find(b => b.id === wo.box_id);

    const message = wo.status === 'Finalizado'
        ? `Hola ${client?.first_name || ''}, nos comunicamos de PIRIPI PRO. Tu vehículo (${vehicle?.license_plate || ''}) ya se encuentra LISTO para retirar. Total: ${formatCurrency(wo.total_price)}.`
        : `Hola ${client?.first_name || ''}, te contactamos de PIRIPI PRO por tu vehículo (${vehicle?.license_plate || ''})...`;

    return (
        <div className="queue-card" onClick={onClick}>
            <div className="queue-card-left">
                <div className="queue-bay">
                    <small>{box ? 'BOX' : 'COLA'}</small>
                    <strong>{box ? box.name.replace('Box ', '') : '—'}</strong>
                </div>
                <div className="queue-info">
                    <h4>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehículo'} — {wo.description}</h4>
                    <p>OT #{wo.order_number} • {client ? `${client.first_name} ${client.last_name}` : ''} • {vehicle?.license_plate}</p>
                </div>
            </div>
            <div className="queue-card-right">
                <div className="queue-meta"><label>Estado</label><StatusBadge status={wo.status} /></div>
                {wo.total_price > 0 && <div className="queue-meta"><label>Total</label><span style={{ color: 'var(--primary)' }}>{formatCurrency(wo.total_price)}</span></div>}

                <div style={{ display: 'flex', gap: 4 }}>
                    {client?.phone && (
                        <a
                            href={`https://wa.me/${client.phone.replace(/\D/g, '').length === 10 ? '549' + client.phone.replace(/\D/g, '') : client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-icon btn-ghost"
                            style={{ width: 32, height: 32, color: '#25D366' }}
                            onClick={e => e.stopPropagation()}
                            title="Notificar por WhatsApp"
                        >
                            <Icon name="whatshot" size={18} />
                        </a>
                    )}
                    <button className="btn btn-icon btn-ghost" style={{ width: 32, height: 32 }}><Icon name="more_vert" size={18} /></button>
                </div>
            </div>
        </div>
    );
};
