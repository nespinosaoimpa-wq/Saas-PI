import React, { useState } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import { SectionHeader, GlassCard, Icon, Modal, FormField, FormRow } from '../components/ui';

export const PromotionsPage = () => {
    const { data: MOCK, addPromotion, deletePromotion } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', discount_type: 'PERCENTAGE', discount_value: '',
        category: '', is_active: true
    });

    const handleSave = async () => {
        if (!formData.name || !formData.discount_value) return alert('Nombre y valor son obligatorios');
        setLoading(true);
        try {
            await addPromotion({
                ...formData,
                discount_value: parseFloat(formData.discount_value)
            });
            setShowModal(false);
            setFormData({ name: '', description: '', discount_type: 'PERCENTAGE', discount_value: '', category: '', is_active: true });
        } catch (e) {
            alert("Error al guardar promo: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar esta promoción?")) return;
        try {
            await deletePromotion(id);
        } catch (e) {
            alert("Error al eliminar: " + e.message);
        }
    };

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <SectionHeader icon="loyalty" title="Gestión de Promociones" right={
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        <Icon name="add" size={16} /> Nueva Promo
                    </button>
                } />
                <div className="grid-auto-cards">
                    {MOCK.promotions?.map(p => (
                        <GlassCard key={p.id} style={{ padding: 20, position: 'relative', borderLeft: `3px solid ${p.is_active ? 'var(--success)' : 'var(--text-muted)'}` }}>
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ position: 'absolute', top: 10, right: 10, color: 'var(--danger)' }}
                                onClick={() => handleDelete(p.id)}
                            >
                                <Icon name="delete" size={16} />
                            </button>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8, paddingRight: 30 }}>
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

            {showModal && (
                <Modal title="Nueva Promoción" onClose={() => setShowModal(false)} width="500px"
                    footer={<><button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Guardando...' : 'Crear Promo'}</button></>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <FormField label="Nombre de la Promo *">
                            <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Especial Lunes de Aceite" />
                        </FormField>
                        <FormField label="Descripción">
                            <textarea className="form-textarea" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Detalles de la promo..." />
                        </FormField>
                        <FormRow>
                            <FormField label="Tipo de Descuento">
                                <select className="form-select" value={formData.discount_type} onChange={e => setFormData({ ...formData, discount_type: e.target.value })}>
                                    <option value="PERCENTAGE">Porcentaje (%)</option>
                                    <option value="FIXED">Monto Fijo ($)</option>
                                </select>
                            </FormField>
                            <FormField label="Valor Descuento *">
                                <input type="number" className="form-input" value={formData.discount_value} onChange={e => setFormData({ ...formData, discount_value: e.target.value })} placeholder="Ej: 10 o 500" />
                            </FormField>
                        </FormRow>
                        <FormField label="Categoría (Opcional)">
                            <input className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Ej: Aceites, Filtros..." />
                        </FormField>
                    </div>
                </Modal>
            )}
        </div>
    );
};
