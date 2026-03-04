import React from 'react';
import { Icon } from './Icon';

export const EmptyState = ({ icon, title, sub }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, opacity: 0.5 }}>
        <Icon name={icon || 'inventory_2'} size={48} style={{ color: 'var(--primary)', marginBottom: 16 }} />
        <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title || 'Sin datos'}</h4>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
);
