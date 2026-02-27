import React from 'react';

export const DataTable = ({ columns, data, onRowClick }) => (
    <div style={{ overflow: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--glass-bg)' }}>
        <table className="data-table">
            <thead><tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr></thead>
            <tbody>
                {data.map((row, i) => (
                    <tr key={row.id || i} onClick={() => onRowClick && onRowClick(row)}>
                        {columns.map(c => <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>)}
                    </tr>
                ))}
                {data.length === 0 && (
                    <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Sin resultados</td></tr>
                )}
            </tbody>
        </table>
    </div>
);
