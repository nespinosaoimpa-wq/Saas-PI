<<<<<<< HEAD
﻿import React, { useState, Fragment } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import { SectionHeader, GlassCard, Icon, Modal, FormField, FormRow } from '../components/ui';
import { supabase } from '../lib/supabase';

export const PromotionsPage = () => {
    const { data: MOCK, refreshData } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', description: '', discount_type: 'PERCENTAGE', discount_value: '', category: '', is_active: true
    });

    const openNew = () => {
        setEditing(null);
        setForm({ name: '', description: '', discount_type: 'PERCENTAGE', discount_value: '', category: '', is_active: true });
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditing(p);
        setForm({ name: p.name, description: p.description || '', discount_type: p.discount_type, discount_value: p.discount_value, category: p.category || '', is_active: p.is_active });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.discount_value) return alert('Nombre y valor de descuento son obligatorios.');
        setSaving(true);
        try {
            const payload = { name: form.name, description: form.description, discount_type: form.discount_type, discount_value: parseFloat(form.discount_value), applies_to_category: form.category || null, is_active: form.is_active };
            if (editing) {
                await supabase.from('promotions').update(payload).eq('id', editing.id);
            } else {
                await supabase.from('promotions').insert([payload]);
            }
            await refreshData();
            setShowModal(false);
        } catch (e) {
            alert('Error: ' + e.message);
        }
        setSaving(false);
    };

    const toggleActive = async (p) => {
        await supabase.from('promotions').update({ is_active: !p.is_active }).eq('id', p.id);
        await refreshData();
=======
﻿import React, { useState } from 'react';
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
>>>>>>> ec079cf17d7864e2b7e79c69ea2b09de8660b2d7
    };

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <SectionHeader icon="loyalty" title="Gestión de Promociones" right={
<<<<<<< HEAD
                    <button className="btn btn-primary btn-sm" onClick={openNew}><Icon name="add" size={16} /> Nueva Promo</button>
=======
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        <Icon name="add" size={16} /> Nueva Promo
                    </button>
>>>>>>> ec079cf17d7864e2b7e79c69ea2b09de8660b2d7
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
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    {p.is_active ? <span className="badge badge-done">Activa</span> : <span className="badge badge-canceled">Inactiva</span>}
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} style={{ padding: 4 }}><Icon name="edit" size={14} /></button>
                                </div>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{p.description}</p>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className="badge badge-active">{p.discount_type === 'PERCENTAGE' ? `${p.discount_value}% OFF` : formatCurrency(p.discount_value) + ' OFF'}</span>
                                {(p.category || p.applies_to_category) && <span className="nav-badge">{p.category || p.applies_to_category}</span>}
                                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto', fontSize: 11 }} onClick={() => toggleActive(p)}>
                                    {p.is_active ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                    {(!MOCK.promotions || MOCK.promotions.length === 0) && (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <Icon name="loyalty" size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                            <p>No hay promociones creadas. Creá la primera.</p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
<<<<<<< HEAD
                <Modal title={editing ? "Editar Promoción" : "Nueva Promoción"} onClose={() => setShowModal(false)}
                    footer={<Fragment><button className="btn btn-ghost" disabled={saving} onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" disabled={saving} onClick={handleSave}>{saving ? 'Guardando...' : 'Guardar'}</button></Fragment>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <FormField label="Nombre de la Promoción *">
                            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Combo Aceite + Filtro" />
                        </FormField>
                        <FormField label="Descripción">
                            <textarea className="form-input" style={{ minHeight: 80 }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalle de la promo..." />
                        </FormField>
                        <FormRow>
                            <FormField label="Tipo de Descuento">
                                <select className="form-select" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })}>
=======
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
>>>>>>> ec079cf17d7864e2b7e79c69ea2b09de8660b2d7
                                    <option value="PERCENTAGE">Porcentaje (%)</option>
                                    <option value="FIXED">Monto Fijo ($)</option>
                                </select>
                            </FormField>
<<<<<<< HEAD
                            <FormField label="Valor del Descuento *">
                                <input className="form-input" type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'PERCENTAGE' ? 'Ej: 10' : 'Ej: 5000'} />
                            </FormField>
                        </FormRow>
                        <FormRow>
                            <FormField label="Categoría (opcional)">
                                <input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ej: Aceite Motor" />
                            </FormField>
                            <FormField label="Estado">
                                <select className="form-select" value={form.is_active ? 'true' : 'false'} onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}>
                                    <option value="true">Activa</option>
                                    <option value="false">Inactiva</option>
                                </select>
                            </FormField>
                        </FormRow>
=======
                            <FormField label="Valor Descuento *">
                                <input type="number" className="form-input" value={formData.discount_value} onChange={e => setFormData({ ...formData, discount_value: e.target.value })} placeholder="Ej: 10 o 500" />
                            </FormField>
                        </FormRow>
                        <FormField label="Categoría (Opcional)">
                            <input className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Ej: Aceites, Filtros..." />
                        </FormField>
>>>>>>> ec079cf17d7864e2b7e79c69ea2b09de8660b2d7
                    </div>
                </Modal>
            )}
        </div>
    );
};

