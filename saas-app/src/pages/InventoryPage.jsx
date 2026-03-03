import React, { useState, Fragment } from 'react';
import { formatCurrency, formatML } from '../data/data';
import { useApp } from '../context/AppContext';
import {
    SearchBar,
    Tabs,
    DataTable,
    Modal,
    FormRow,
    FormField,
    Icon,
    SectionHeader,
    GlassCard,
    LiquidGauge
} from '../components/ui';

export const InventoryPage = ({ initialScannedCode = '' }) => {
    const { data: MOCK, updateInventoryStock, addInventoryItem } = useApp();
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const [showEntry, setShowEntry] = useState(false);
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState('');
    const [isNewProduct, setIsNewProduct] = useState(!!initialScannedCode);

    // Estado para producto nuevo
    const [newProduct, setNewProduct] = useState({
        name: '', category: '', brand: '', supplier: '', barcode: initialScannedCode,
        cost_price: '', sell_price: '', stock_quantity: '', stock_type: 'UNIT', stock_min: 5
    });

    // Si viene un código inicial pero el componente ya estaba montado, lo tomamos
    React.useEffect(() => {
        if (initialScannedCode) {
            setIsNewProduct(true);
            setShowEntry(true);
            setNewProduct(prev => ({ ...prev, barcode: initialScannedCode }));
        }
    }, [initialScannedCode]);

    const handleAddStock = () => {
        if (isNewProduct) {
            if (!newProduct.name || !newProduct.sell_price) return alert('Nombre y precio de venta son obligatorios');
            addInventoryItem({
                ...newProduct,
                cost_price: parseFloat(newProduct.cost_price) || 0,
                sell_price: parseFloat(newProduct.sell_price) || 0,
                stock_quantity: parseFloat(newProduct.stock_quantity) || 0,
                stock_min: parseFloat(newProduct.stock_min) || 5
            });
        } else {
            if (!selectedItem || !quantity) return;
            const item = MOCK.inventory.find(i => i.id === selectedItem);
            if (!item) return;

            updateInventoryStock(item.id, parseFloat(quantity), item.stock_type === 'VOLUME');
        }

        setShowEntry(false);
        setSelectedItem('');
        setQuantity('');
        setIsNewProduct(false);
    };

    const categories = [...new Set(MOCK.inventory.map(i => i.category))];
    const brands = [...new Set(MOCK.inventory.map(i => i.brand))];
    const filtered = MOCK.inventory.filter(i => {
        const matchSearch = `${i.name} ${i.barcode} ${i.brand} ${i.category}`.toLowerCase().includes(search.toLowerCase());
        const matchTab = tab === 'all' || (tab === 'low' && ((i.stock_type === 'UNIT' && i.stock_quantity <= i.stock_min) || (i.stock_type === 'VOLUME' && i.stock_ml <= i.stock_min_ml))) || (tab === 'volume' && i.stock_type === 'VOLUME') || (tab === 'unit' && i.stock_type === 'UNIT');
        return matchSearch && matchTab;
    });

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 250 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, cÃ³digo de barras, marca..." /></div>
                    <Tabs tabs={[{ key: 'all', label: 'Todos' }, { key: 'volume', label: 'Volumen' }, { key: 'unit', label: 'Unidad' }, { key: 'low', label: 'âš  Bajo Stock' }]} active={tab} onChange={setTab} />
                    <button className="btn btn-primary" onClick={() => setShowEntry(true)}><Icon name="add_shopping_cart" size={18} /> Ingreso MercaderÃ­a</button>
                    <button className="btn btn-ghost"><Icon name="download" size={18} /> Exportar Excel</button>
                </div>

                {/* Volume gauges for oils */}
                {(tab === 'all' || tab === 'volume') && (
                    <div>
                        <SectionHeader icon="water_drop" title="Niveles de Aceite / Fluidos" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                            {MOCK.inventory.filter(i => i.stock_type === 'VOLUME').map(item => (
                                <GlassCard key={item.id} style={{ padding: 16 }}>
                                    <LiquidGauge label={item.name.split(' ').slice(0, 3).join(' ')} current_ml={item.stock_ml} max_ml={item.container_size_ml * 15} min_ml={item.stock_min_ml} />
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                        Precio/L: {formatCurrency(item.sell_price)} â€¢ Costo: {formatCurrency(item.cost_price)}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}

                <DataTable
                    columns={[
                        { key: 'name', label: 'Producto', render: r => <div><strong>{r.name}</strong><div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{r.barcode || 'Sin cÃ³digo'}</div></div> },
                        { key: 'category', label: 'CategorÃ­a' },
                        { key: 'brand', label: 'Marca' },
                        { key: 'supplier', label: 'Proveedor' },
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
                    ]}
                    data={filtered}
                />

                {showEntry && (
                    <Modal title={isNewProduct ? "Crear Nuevo Producto" : "Ingreso de Mercadería"} onClose={() => { setShowEntry(false); setIsNewProduct(false); }} width="700px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => { setShowEntry(false); setIsNewProduct(false); }}>Cancelar</button><button className="btn btn-primary" onClick={handleAddStock}>{isNewProduct ? 'Crear Producto' : 'Guardar Ingreso'}</button></Fragment>}>

                        {isNewProduct ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <FormRow>
                                    <FormField label="Nombre del Producto *">
                                        <input className="form-input" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Ej: Filtro de Aceite WEGA 123" />
                                    </FormField>
                                    <FormField label="Código de Barras">
                                        <input className="form-input" value={newProduct.barcode} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} placeholder="Pistolear aquí..." />
                                    </FormField>
                                </FormRow>
                                <FormRow>
                                    <FormField label="Categoría">
                                        <select className="form-select" value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}>
                                            <option value="">Seleccionar...</option>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            <option value="Otra">Otra...</option>
                                        </select>
                                    </FormField>
                                    <FormField label="Marca">
                                        <select className="form-select" value={newProduct.brand} onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}>
                                            <option value="">Seleccionar...</option>
                                            {brands.map(b => <option key={b} value={b}>{b}</option>)}
                                            <option value="Otra">Otra...</option>
                                        </select>
                                    </FormField>
                                </FormRow>
                                <FormRow>
                                    <FormField label="Proveedor (Asociar)">
                                        <select className="form-select" value={newProduct.supplier} onChange={e => setNewProduct({ ...newProduct, supplier: e.target.value })}>
                                            <option value="">Sin proveedor asignado...</option>
                                            {MOCK.suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Tipo de Stock">
                                        <select className="form-select" value={newProduct.stock_type} onChange={e => setNewProduct({ ...newProduct, stock_type: e.target.value })}>
                                            <option value="UNIT">Por Unidad (Cajas, Filtros)</option>
                                            <option value="VOLUME">Por Volumen (Aceite Suelto en Litros/ml)</option>
                                        </select>
                                    </FormField>
                                </FormRow>
                                <FormRow>
                                    <FormField label="Costo (Compra)">
                                        <input className="form-input" type="number" placeholder="$0.00" value={newProduct.cost_price} onChange={e => setNewProduct({ ...newProduct, cost_price: e.target.value })} />
                                    </FormField>
                                    <FormField label="Precio (Venta) *">
                                        <input className="form-input" type="number" placeholder="$0.00" value={newProduct.sell_price} onChange={e => setNewProduct({ ...newProduct, sell_price: e.target.value })} />
                                    </FormField>
                                    <FormField label="Stock Inicial">
                                        <input className="form-input" type="number" placeholder="Ej: 10" value={newProduct.stock_quantity} onChange={e => setNewProduct({ ...newProduct, stock_quantity: e.target.value })} />
                                    </FormField>
                                </FormRow>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Modificar precio o cantidad masivamente. Filtrar por marca o proveedor.</p>
                                <FormRow>
                                    <FormField label="Filtrar por Marca">
                                        <select className="form-select"><option value="">Todas las marcas</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}</select>
                                    </FormField>
                                    <FormField label="Filtrar por Proveedor">
                                        <select className="form-select"><option value="">Todos los proveedores</option>{MOCK.suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
                                    </FormField>
                                </FormRow>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                                <FormRow>
                                    <FormField label="Producto">
                                        <select className="form-select" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                                            <option value="">Seleccionar producto...</option>
                                            {filtered.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                        </select>
                                    </FormField>
                                </FormRow>
                                <FormRow>
                                    <FormField label="Cantidad a ingresar">
                                        <input className="form-input" type="number" placeholder="Ej: 10 o 5000 (ml)" value={quantity} onChange={e => setQuantity(e.target.value)} />
                                    </FormField>
                                    <FormField label="Nuevo precio costo"><input className="form-input" type="number" placeholder="$0.00" /></FormField>
                                    <FormField label="Nuevo precio venta"><input className="form-input" type="number" placeholder="$0.00" /></FormField>
                                </FormRow>
                            </div>
                        )}

                    </Modal>
                )}
            </div>
        </div>
    );
};
