import React from 'react';
import { Icon } from './Icon';

export const StatCard = ({ icon, label, value, sub, barPercent, barAlert, tag }) => (
    <div className="stat-card">
        <div className="stat-card-header">
            <div className="stat-card-icon"><Icon name={icon} /></div>
            {tag && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{tag}</span>}
        </div>
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
        {barPercent !== undefined && (
            <div className="stat-bar"><div className={`stat-bar-fill ${barAlert ? 'alert' : ''}`} style={{ width: barPercent + '%' }} /></div>
        )}
    </div>
);
