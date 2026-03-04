import React, { useState, useEffect, Fragment } from 'react';
import { formatCurrency, formatML } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
    SearchBar, Tabs, DataTable, Modal, FormRow, FormField, Icon, SectionHeader, GlassCard, LiquidGauge
} from '../components/ui';

export const InventoryPage = ({ initialScannedCode = '' }) => {
    const { data: MOCK, refreshData } = useApp();
    const { user } = useAuth();

    // Check access
    const canEdit = user?.role === 'admin' || user?.role === 'mecanico' || user?.role === 'cajero';

    const inventory = MOCK.inventory || [];
    const suppliers = MOCK.suppliers || [];

    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '', category: '', brand: '', supplier: '', barcode: initialScannedCode,
        cost_price: '', sell_price: '', stock_quantity: '', stock_ml: '',
        stock_type: 'UNIT', stock_min: 5, stock_min_ml: 5000, container_size_ml: 1000
    });

    useEffect(() => {
        if (initialScannedCode) {
            handleOpenModal(null, initialScannedCode);
        }
    }, [initialScannedCode]);

    const handleOpenModal = (item = null, code = '') => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name || '', category: item.category || '', brand: item.brand || '', supplier: item.supplier || '',
                barcode: item.barcode || '', cost_price: item.cost_price || '', sell_price: item.sell_price || '',
                stock_quantity: item.stock_quantity || '', stock_ml: item.stock_ml || '',
                stock_type: item.stock_type || 'UNIT', stock_min: item.stock_min || 0,
                stock_min_ml: item.stock_min_ml || 0, container_size_ml: item.container_size_ml || 0
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '', category: '', brand: '', supplier: '', barcode: code,
                cost_price: '', sell_price: '', stock_quantity: '', stock_ml: '',
                stock_type: 'UNIT', stock_min: 5, stock_min_ml: 5000, container_size_ml: 1000
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.sell_price) return alert('Nombre y precio de venta son obligatorios');
        setLoading(true);

        const payload = {
            name: formData.name,
            category: formData.category,
            brand: formData.brand,
            supplier: formData.supplier,
            barcode: formData.barcode || null,
            cost_price: parseFloat(formData.cost_price) || 0,
            sell_price: parseFloat(formData.sell_price) || 0,
            stock_type: formData.stock_type,
            stock_quantity: parseInt(formData.stock_quantity) || 0,
            stock_ml: parseInt(formData.stock_ml) || 0,
            stock_min: parseInt(formData.stock_min) || 0,
            stock_min_ml: parseInt(formData.stock_min_ml) || 0,
            container_size_ml: parseInt(formData.container_size_ml) || 0
        };

        try {
            if (editingItem) {
                const { error } = await supabase.from('inventory').update(payload).eq('id', editingItem.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('inventory').insert([payload]);
                if (error) throw error;
            }
            await refreshData();
            setShowModal(false);
        } catch (e) {
            console.error(e);
            alert("Error al guardar: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Eliminar producto del inventario? Esta acción no se puede deshacer.')) {
            try {
                await supabase.from('inventory').delete().eq('id', id);
                await refreshData();
            } catch (e) {
                console.error(e);
            }
        }
    };

    const categories = [...new Set(inventory.map(i => i.category).filter(Boolean))];
    const brands = [...new Set(inventory.map(i => i.brand).filter(Boolean))];

    const filtered = inventory.filter(i => {
        const matchSearch = `${i.name} ${i.barcode || ''} ${i.brand || ''} ${i.category || ''}`.toLowerCase().includes(search.toLowerCase());
        const isLow = (i.stock_type === 'UNIT' && i.stock_quantity <= i.stock_min) || (i.stock_type === 'VOLUME' && i.stock_ml <= i.stock_min_ml);
        const matchTab = tab === 'all' || (tab === 'low' && isLow) || (tab === 'volume' && i.stock_type === 'VOLUME') || (tab === 'unit' && i.stock_type === 'UNIT');
        return matchSearch && matchTab;
    });

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 250 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, código de barras, marca..." /></div>
                    <Tabs tabs={[{ key: 'all', label: 'Todos' }, { key: 'volume', label: 'Volumen' }, { key: 'unit', label: 'Unidad' }, { key: 'low', label: '⚠️ Bajo Stock' }]} active={tab} onChange={setTab} />
                    {canEdit && <button className="btn btn-primary" onClick={() => handleOpenModal()}><Icon name="add_shopping_cart" size={18} /> Nuevo Producto</button>}
                </div>

                {/* Volume gauges for oils */}
                {(tab === 'all' || tab === 'volume') && (
                    <div>
                        <SectionHeader icon="water_drop" title="Niveles de Aceite / Fluidos" />
                        <div className="grid-auto-cards-sm">
                            {inventory.filter(i => i.stock_type === 'VOLUME').map(item => (
                                <GlassCard key={item.id} style={{ padding: 16 }}>
                                    <LiquidGauge label={item.name.split(' ').slice(0, 3).join(' ')} current_ml={item.stock_ml} max_ml={(item.container_size_ml || 200000) * 1} min_ml={item.stock_min_ml} />
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                        Precio/L: {formatCurrency(item.sell_price)} • Costo/L: {formatCurrency(item.cost_price)}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}

                <DataTable
                    columns={[
                        { key: 'name', label: 'Producto', render: r => <div><strong>{r.name}</strong><div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{r.barcode || 'Sin código'}</div></div> },
                        { key: 'category', label: 'Categoría' },
                        { key: 'brand', label: 'Marca' },
                        {
                            key: 'stock', label: 'Stock', render: r => {
                                const isLow = (r.stock_type === 'UNIT' && r.stock_quantity <= r.stock_min) || (r.stock_type === 'VOLUME' && r.stock_ml <= r.stock_min_ml);
                                return <span style={{ color: isLow ? 'var(--danger)' : 'var(--primary)', fontWeight: 700 }}>
                                    {r.stock_type === 'VOLUME' ? formatML(r.stock_ml) : `${r.stock_quantity} uds`}
                                </span>;
                            }
                        },
                        { key: 'cost', label: 'Costo', render: r => formatCurrency(r.cost_price) },
                        { key: 'price', label: 'Venta', render: r => <strong style={{ color: 'var(--primary)' }}>{formatCurrency(r.sell_price)}{r.stock_type === 'VOLUME' ? '/L' : ''}</strong> },
                        {
                            key: 'actions', label: '', render: r => (
                                canEdit && <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleOpenModal(r)}>
                                        <Icon name="edit" size={16} />
                                    </button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r.id)} style={{ color: 'var(--danger)' }}>
                                        <Icon name="delete" size={16} />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={filtered}
                />

                {showModal && (
                    <Modal title={editingItem ? "Editar Producto" : "Nuevo Producto"} onClose={() => setShowModal(false)} width="700px"
                        footer={<Fragment><button className="btn btn-ghost" disabled={loading} onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" disabled={loading} onClick={handleSave}>{loading ? 'Guardando...' : 'Guardar Producto'}</button></Fragment>}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormRow>
                                <FormField label="Nombre del Producto *">
                                    <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: Filtro de Aceite WEGA 123" />
                                </FormField>
                                <FormField label="Código de Barras">
                                    <input className="form-input" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} placeholder="Pistolear aquí..." />
                                </FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Categoría">
                                    <input className="form-input" list="category-list" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Seleccionar o escribir..." />
                                    <datalist id="category-list">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </FormField>
                                <FormField label="Marca">
                                    <input className="form-input" list="brand-list" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} placeholder="Seleccionar o escribir..." />
                                    <datalist id="brand-list">
                                        {brands.map(b => <option key={b} value={b} />)}
                                    </datalist>
                                </FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Proveedor">
                                    <input className="form-input" list="supplier-list" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} placeholder="Seleccionar o escribir..." />
                                    <datalist id="supplier-list">
                                        {suppliers.map(s => <option key={s.id} value={s.name} />)}
                                    </datalist>
                                </FormField>
                                <FormField label="Tipo de Stock">
                                    <select className="form-select" value={formData.stock_type} onChange={e => setFormData({ ...formData, stock_type: e.target.value })}>
                                        <option value="UNIT">Por Unidad (Cajas, Filtros, Cubiertas)</option>
                                        <option value="VOLUME">Por Volumen (Aceite Suelto en Litros/ml)</option>
                                    </select>
                                </FormField>
                            </FormRow>

                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />

                            <FormRow>
                                <FormField label="Costo (Compra)">
                                    <input type="number" className="form-input" placeholder="$0.00" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} />
                                </FormField>
                                <FormField label="Precio (Venta Público) *">
                                    <input type="number" className="form-input" placeholder="$0.00" value={formData.sell_price} onChange={e => setFormData({ ...formData, sell_price: e.target.value })} />
                                </FormField>
                            </FormRow>

                            {formData.stock_type === 'UNIT' ? (
                                <FormRow>
                                    <FormField label="Cantidad en Stock">
                                        <input type="number" className="form-input" placeholder="Ej: 10" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })} />
                                    </FormField>
                                    <FormField label="Stock Mínimo (Alerta)">
                                        <input type="number" className="form-input" placeholder="Ej: 5" value={formData.stock_min} onChange={e => setFormData({ ...formData, stock_min: e.target.value })} />
                                    </FormField>
                                </FormRow>
                            ) : (
                                <FormRow>
                                    <FormField label="Mililitros actuales">
                                        <input type="number" className="form-input" placeholder="Ej: 50000 (50 Litros)" value={formData.stock_ml} onChange={e => setFormData({ ...formData, stock_ml: e.target.value })} />
                                    </FormField>
                                    <FormField label="Capacidad Tambor/Barril (ml)">
                                        <input type="number" className="form-input" placeholder="Ej: 200000 (200 Litros)" value={formData.container_size_ml} onChange={e => setFormData({ ...formData, container_size_ml: e.target.value })} />
                                    </FormField>
                                    <FormField label="Alerta Mínimo (ml)">
                                        <input type="number" className="form-input" placeholder="Ej: 15000" value={formData.stock_min_ml} onChange={e => setFormData({ ...formData, stock_min_ml: e.target.value })} />
                                    </FormField>
                                </FormRow>
                            )}
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};
