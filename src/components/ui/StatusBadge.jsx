import React from 'react';
import { getStatusBadge } from '../../data/data';

export const StatusBadge = ({ status, children, labelOverride }) => (
    <span className={`badge ${getStatusBadge(status)}`}>{labelOverride || children || status}</span>
);
