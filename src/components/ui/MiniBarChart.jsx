import React from 'react';

export const MiniBarChart = ({ data, height = 40 }) => (
    <div className="mini-bars" style={{ height }}>
        {data.map((v, i) => {
            const max = Math.max(...data);
            return <div key={i} className={`mini-bar ${i === data.indexOf(max) ? 'active' : ''}`} style={{ height: (v / max * 100) + '%' }} />;
        })}
    </div>
);
