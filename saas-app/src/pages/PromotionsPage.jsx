import React from 'react';
import { MOCK, formatCurrency } from '../data/data';
import { SectionHeader, GlassCard, Icon } from '../components/ui';

export const PromotionsPage = () => (
    <div className="page-content">
        <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
            <SectionHeader icon="local_offer" title="GestiÃ³n de Promociones" right={
                <button className="btn btn-primary btn-sm"><Icon name="add" size={16} /> Nueva Promo</button>
            } />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
                {MOCK.promotions.map(p => (
                    <GlassCard key={p.id} style={{ padding: 20, borderLeft: `3px solid ${p.is_active ? 'var(--alert)' : 'var(--text-muted)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h4>
                            {p.is_active ? <span className="badge badge-done">Activa</span> : <span className="badge badge-canceled">Inactiva</span>}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{p.description}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <span className="nav-badge">{p.discount_type === 'PERCENTAGE' ? `${p.discount_value}% OFF` : formatCurrency(p.discount_value) + ' OFF'}</span>
                            {p.category && <span className="nav-badge">{p.category}</span>}
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    </div>
);
