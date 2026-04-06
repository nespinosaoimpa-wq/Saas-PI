import React from 'react';
import { formatML } from '../../data/data';

export const LiquidGauge = ({ label, current_ml, max_ml, min_ml, percent, color }) => {
    // Determine percent: use prop if provided, otherwise calculate from ml
    const calculatedPercent = max_ml > 0 ? (current_ml / max_ml) * 100 : 0;
    const p = percent !== undefined ? percent : calculatedPercent;
    const finalPercent = Math.min(100, Math.max(0, p));

    // Thresholds: Use min_ml relative to max_ml if provided, else defaults
    const lowThreshold = min_ml && max_ml ? (min_ml / max_ml) * 100 : 25;
    const criticalThreshold = lowThreshold / 2.5; // Critical is much lower than low

    const isLow = finalPercent <= lowThreshold;
    const isCritical = finalPercent <= criticalThreshold || finalPercent <= 5; // Absolute floor of 5%

    // Dynamic Color
    let liquidColor = color || 'var(--primary)';
    if (isCritical) liquidColor = 'var(--danger)';
    else if (isLow) liquidColor = 'var(--warning)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
                    {isCritical && (
                        <span style={{ 
                            fontSize: 9, 
                            fontWeight: 800, 
                            color: 'var(--danger)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            animation: 'pulse-badge 1s infinite'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>warning</span> CRÍTICO
                        </span>
                    )}
                </div>
            )}
            
            <div className={`liquid-gauge ${isCritical ? 'pulse-critical' : ''}`} style={{ height: 80, borderRadius: 12, border: '1px solid var(--border)' }}>
                {/* The Liquid Fill */}
                <div 
                    className="liquid-fill" 
                    style={{ 
                        height: finalPercent + '%', 
                        backgroundColor: liquidColor,
                        boxShadow: `0 0 20px ${liquidColor}44`
                    }} 
                />
                
                {/* Value Display */}
                <div className="liquid-value">
                    <span style={{ fontSize: 13, color: 'white' }}>{Math.round(finalPercent)}%</span>
                    {max_ml > 0 && (
                        <small style={{ fontSize: 9, opacity: 0.8 }}>{formatML(current_ml)}</small>
                    )}
                </div>

                {/* Glass Reflection Overlay */}
                <div style={{ 
                    position: 'absolute', 
                    top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%)',
                    pointerEvents: 'none',
                    zIndex: 5,
                    borderRadius: 'inherit'
                }} />
            </div>
        </div>
    );
};

