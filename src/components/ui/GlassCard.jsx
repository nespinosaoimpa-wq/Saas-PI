import React from 'react';

export const GlassCard = ({ children, className, onClick, style }) => (
    <div className={`glass-card ${className || ''}`} onClick={onClick} style={style}>{children}</div>
);
