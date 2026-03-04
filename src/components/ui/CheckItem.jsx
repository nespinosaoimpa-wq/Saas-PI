import React from 'react';
import { Icon } from './Icon';

export const CheckItem = ({ label, sub, checked, onChange }) => (
    <div className={`check-item ${checked ? 'checked' : ''}`} onClick={onChange}>
        <div className="check-box">{checked && <Icon name="check" size={16} />}</div>
        <div>
            <div className="check-label">{label}</div>
            {sub && <div className="check-sub">{sub}</div>}
        </div>
    </div>
);
