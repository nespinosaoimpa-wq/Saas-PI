import React from 'react';
import { formatML } from '../../data/data';

export const LiquidGauge = ({ label, current_ml, max_ml, min_ml, color }) => {
    const percent = Math.min(100, Math.max(0, (current_ml / max_ml) * 100));
    const isLow = current_ml <= min_ml;
    const c = color || (isLow ? '#ff3366' : 'var(--primary)');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
                {isLow && <span className="badge badge-canceled" style={{ fontSize: 9 }}>âš  BAJO</span>}
            </div>
            <div className="liquid-gauge" style={{ height: 100, borderRadius: 8 }}>
                <div className="liquid-fill" style={{ height: percent + '%', background: `linear-gradient(0deg, ${c} 0%, ${c}55 100%)` }} />
                <div className="liquid-value">{formatML(current_ml)}<small> / {formatML(max_ml)}</small></div>
            </div>
        </div>
    );
};
