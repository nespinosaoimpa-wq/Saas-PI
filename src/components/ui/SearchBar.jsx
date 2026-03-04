import React from 'react';
import { Icon } from './Icon';

export const SearchBar = ({ value, onChange, placeholder }) => (
    <div className="search-bar">
        <Icon name="search" className="search-icon" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Buscar...'} />
    </div>
);
