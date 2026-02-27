import React from 'react';

export const Icon = ({ name, size, className }) => (
    <span className={`material-symbols-outlined ${className || ''}`} style={size ? { fontSize: size } : {}}>{name}</span>
);
