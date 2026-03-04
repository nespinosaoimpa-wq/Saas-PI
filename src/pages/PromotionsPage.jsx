import React from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import { SectionHeader, GlassCard, Icon } from '../components/ui';

export const PromotionsPage = () => {
    const { data: MOCK } = useApp();
    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <SectionHeader icon="loyalty" title="Gestión de Promociones" right={
                    <button className="btn btn-primary btn-sm"><Icon name="add" size={16} /> Nueva Promo</button>
                } />
                <div className="grid-auto-cards">
                    {MOCK.promotions.map(p => (
                        <GlassCard key={p.id} style={{ padding: 20, borderLeft: `3px solid ${p.is_active ? 'var(--success)' : 'var(--text-muted)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                <h4 style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</h4>
                                {p.is_active ? <span className="badge badge-done">Activa</span> : <span className="badge badge-canceled">Inactiva</span>}
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{p.description}</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span className="badge badge-active">{p.discount_type === 'PERCENTAGE' ? `${p.discount_value}% OFF` : formatCurrency(p.discount_value) + ' OFF'}</span>
                                {p.category && <span className="nav-badge">{p.category}</span>}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </div>
    );
};
