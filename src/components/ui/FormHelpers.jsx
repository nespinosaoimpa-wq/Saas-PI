import React from 'react';

export const FormRow = ({ children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>{children}</div>
);

export const FormField = ({ label, children }) => (
    <div className="form-group"><label className="form-label">{label}</label>{children}</div>
);
