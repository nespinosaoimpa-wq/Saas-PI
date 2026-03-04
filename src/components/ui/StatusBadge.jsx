import React from 'react';
import { getStatusBadge } from '../../data/data';

export const StatusBadge = ({ status }) => (
    <span className={`badge ${getStatusBadge(status)}`}>{status}</span>
);
