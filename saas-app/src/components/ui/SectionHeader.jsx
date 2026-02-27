import React from 'react';
import { Icon } from './Icon';

export const SectionHeader = ({ icon, title, right }) => (
    <div className="section-header">
        <div className="section-title">{icon && <Icon name={icon} />}{title}</div>
        {right && <div style={{ display: 'flex', gap: 8 }}>{right}</div>}
    </div>
);
