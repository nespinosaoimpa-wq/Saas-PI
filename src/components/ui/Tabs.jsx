import React from 'react';

export const Tabs = ({ tabs, active, onChange }) => (
    <div className="tabs">
        {tabs.map(t => (
            <button key={t.key} className={`tab ${active === t.key ? 'active' : ''}`} onClick={() => onChange(t.key)}>{t.label}</button>
        ))}
    </div>
);
