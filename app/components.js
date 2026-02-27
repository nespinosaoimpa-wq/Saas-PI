// ============================================================
// SAAS PIRIPI - Reusable UI Components (React)
// ============================================================
const { useState, useEffect, useRef, Fragment } = React;

// ---- Icon helper ----
const Icon = ({ name, size, className }) => (
    <span className={`material-symbols-outlined ${className || ''}`} style={size ? { fontSize: size } : {}}>{name}</span>
);

// ---- Glass Card ----
const GlassCard = ({ children, className, onClick, style }) => (
    <div className={`glass-card ${className || ''}`} onClick={onClick} style={style}>{children}</div>
);

// ---- Stat Card ----
const StatCard = ({ icon, label, value, sub, barPercent, barAlert, tag }) => (
    <div className="stat-card">
        <div className="stat-card-header">
            <div className="stat-card-icon"><Icon name={icon} /></div>
            {tag && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{tag}</span>}
        </div>
        <div className="stat-card-label">{label}</div>
        <div className="stat-card-value">{value}</div>
        {sub && <div className="stat-card-sub">{sub}</div>}
        {barPercent !== undefined && (
            <div className="stat-bar"><div className={`stat-bar-fill ${barAlert ? 'alert' : ''}`} style={{ width: barPercent + '%' }} /></div>
        )}
    </div>
);

// ---- Mini Bar Chart ----
const MiniBarChart = ({ data, height = 40 }) => (
    <div className="mini-bars" style={{ height }}>
        {data.map((v, i) => {
            const max = Math.max(...data);
            return <div key={i} className={`mini-bar ${i === data.indexOf(max) ? 'active' : ''}`} style={{ height: (v / max * 100) + '%' }} />;
        })}
    </div>
);

// ---- Status Badge ----
const StatusBadge = ({ status }) => (
    <span className={`badge ${getStatusBadge(status)}`}>{status}</span>
);

// ---- Queue Card (Work Order in Service Queue) ----
const QueueCard = ({ wo, onClick }) => {
    const client = getClient(wo.client_id);
    const vehicle = getVehicle(wo.vehicle_id);
    const box = MOCK.boxes.find(b => b.id === wo.box_id);
    return (
        <div className="queue-card" onClick={onClick}>
            <div className="queue-card-left">
                <div className="queue-bay">
                    <small>{box ? 'BOX' : 'COLA'}</small>
                    <strong>{box ? box.name.replace('Box ', '') : '—'}</strong>
                </div>
                <div className="queue-info">
                    <h4>{vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehículo'} — {wo.description}</h4>
                    <p>OT #{wo.order_number} • {client ? `${client.first_name} ${client.last_name}` : ''} • {vehicle?.license_plate}</p>
                </div>
            </div>
            <div className="queue-card-right">
                <div className="queue-meta"><label>Estado</label><StatusBadge status={wo.status} /></div>
                {wo.total_price > 0 && <div className="queue-meta"><label>Total</label><span style={{ color: 'var(--primary)' }}>{formatCurrency(wo.total_price)}</span></div>}
                <button className="btn btn-icon btn-ghost" style={{ width: 32, height: 32 }}><Icon name="more_vert" size={18} /></button>
            </div>
        </div>
    );
};

// ---- Liquid Gauge ----
const LiquidGauge = ({ label, current_ml, max_ml, min_ml, color }) => {
    const percent = Math.min(100, Math.max(0, (current_ml / max_ml) * 100));
    const isLow = current_ml <= min_ml;
    const c = color || (isLow ? '#ff3366' : 'var(--primary)');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
                {isLow && <span className="badge badge-canceled" style={{ fontSize: 9 }}>⚠ BAJO</span>}
            </div>
            <div className="liquid-gauge" style={{ height: 100, borderRadius: 8 }}>
                <div className="liquid-fill" style={{ height: percent + '%', background: `linear-gradient(0deg, ${c} 0%, ${c}55 100%)` }} />
                <div className="liquid-value">{formatML(current_ml)}<small> / {formatML(max_ml)}</small></div>
            </div>
        </div>
    );
};

// ---- Check Item ----
const CheckItem = ({ label, sub, checked, onChange }) => (
    <div className={`check-item ${checked ? 'checked' : ''}`} onClick={onChange}>
        <div className="check-box">{checked && <Icon name="check" size={16} />}</div>
        <div>
            <div className="check-label">{label}</div>
            {sub && <div className="check-sub">{sub}</div>}
        </div>
    </div>
);

// ---- Search Bar ----
const SearchBar = ({ value, onChange, placeholder }) => (
    <div className="search-bar">
        <Icon name="search" className="search-icon" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Buscar...'} />
    </div>
);

// ---- Tabs ----
const Tabs = ({ tabs, active, onChange }) => (
    <div className="tabs">
        {tabs.map(t => (
            <button key={t.key} className={`tab ${active === t.key ? 'active' : ''}`} onClick={() => onChange(t.key)}>{t.label}</button>
        ))}
    </div>
);

// ---- Modal ----
const Modal = ({ title, children, onClose, footer, width }) => (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-box" style={width ? { maxWidth: width } : {}}>
            <div className="modal-header">
                <h3>{title}</h3>
                <button className="btn btn-icon btn-ghost" onClick={onClose} style={{ width: 32, height: 32 }}><Icon name="close" size={18} /></button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
        </div>
    </div>
);

// ---- Empty State ----
const EmptyState = ({ icon, title, sub }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, opacity: 0.5 }}>
        <Icon name={icon || 'inventory_2'} size={48} style={{ color: 'var(--primary)', marginBottom: 16 }} />
        <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{title || 'Sin datos'}</h4>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
);

// ---- Section Header ----
const SectionHeader = ({ icon, title, right }) => (
    <div className="section-header">
        <div className="section-title">{icon && <Icon name={icon} />}{title}</div>
        {right && <div style={{ display: 'flex', gap: 8 }}>{right}</div>}
    </div>
);

// ---- Health Score Ring ----
const HealthRing = ({ score, size = 48 }) => {
    const radius = (size - 6) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getHealthColor(score);
    return (
        <div className="progress-ring" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={3} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
            </svg>
            <span className="progress-ring-value" style={{ fontSize: size * 0.28, color }}>{score}</span>
        </div>
    );
};

// ---- Data Table ----
const DataTable = ({ columns, data, onRowClick }) => (
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

// ---- Form helpers ----
const FormRow = ({ children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>{children}</div>
);
const FormField = ({ label, children }) => (
    <div className="form-group"><label className="form-label">{label}</label>{children}</div>
);
