import React, { useState, Fragment, useRef, useEffect } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import {
    SectionHeader,
    Modal,
    FormField,
    Icon,
    CameraScanner,
    PrintableSaleTicket
} from '../components/ui';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

export const SalesPage = () => {
    const { data: MOCK, processSale, exportToExcel } = useApp();
    const [cart, setCart] = useState([]);
    const [manualCode, setManualCode] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [payMethod, setPayMethod] = useState('EFECTIVO');
    const [lastSale, setLastSale] = useState(null);
    const [printSale, setPrintSale] = useState(null);
    const codeInputRef = useRef(null);

    // Buscar producto por código o nombre
    const findProduct = (code) => {
        return MOCK.inventory.find(i =>
            (i.barcode && i.barcode === code) ||
            i.id.toLowerCase() === code.toLowerCase() ||
            i.name.toLowerCase().includes(code.toLowerCase())
        );
    };

    // Agregar producto al carrito
    const addToCart = (code) => {
        const item = findProduct(code);
        if (!item) {
            alert(`Producto "${code}" no encontrado en inventario.`);
            return;
        }

        setCart(prev => {
            const existing = prev.find(ci => ci.id === item.id);
            if (existing) {
                return prev.map(ci => ci.id === item.id ? { ...ci, qty: ci.qty + 1 } : ci);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    // Escuchar escáner físico global
    useBarcodeScanner((code) => {
        addToCart(code);
    });

    const handleManualAdd = () => {
        if (!manualCode.trim()) return;
        addToCart(manualCode.trim());
        setManualCode('');
        codeInputRef.current?.focus();
    };

    const handleCameraScan = (code) => {
        addToCart(code);
        setShowCamera(false);
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(ci => {
            if (ci.id === id) {
                const newQty = ci.qty + delta;
                return newQty > 0 ? { ...ci, qty: newQty } : ci;
            }
            return ci;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(ci => ci.id !== id));
    };

    const total = cart.reduce((sum, ci) => sum + (ci.sell_price * ci.qty), 0);

    const handleCheckout = () => {
        if (cart.length === 0) return alert('El carrito está vacío');
        const saleTotal = processSale(cart, payMethod);
        const saleData = { items: [...cart], total: saleTotal, method: payMethod, date: new Date() };
        setLastSale(saleData);
        setPrintSale(saleData);
        setCart([]);
    };

    const handleCancelSale = () => {
        if (cart.length === 0) return;
        if (window.confirm('¿Cancelar la venta actual y vaciar el carrito?')) {
            setCart([]);
        }
    };

    return (
        <div className="page-content">
            <div className="page-grid grid-sales">

                {/* Columna Izquierda: Carrito */}
                <div>
                    {/* Barra de escaneo */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <input
                            ref={codeInputRef}
                            className="form-input"
                            placeholder="Escanear código o buscar producto..."
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                            style={{ flex: 1, fontSize: 16, padding: '12px 16px' }}
                            autoFocus
                        />
                        <button className="btn btn-primary" onClick={handleManualAdd} style={{ padding: '12px 20px' }}>
                            <Icon name="add_shopping_cart" size={20} /> Agregar
                        </button>
                        <button className="btn btn-ghost" onClick={() => setShowCamera(true)} style={{ padding: '12px 16px' }}>
                            <Icon name="photo_camera" size={20} />
                        </button>
                        <button className="btn btn-ghost" onClick={() => exportToExcel('sales')} style={{ padding: '12px 16px', marginLeft: 'auto' }} title="Exportar Ventas a Excel">
                            <Icon name="download" size={20} />
                        </button>
                    </div>

                    {/* Lista de productos rápidos */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                        {MOCK.inventory.slice(0, 8).map(item => (
                            <button
                                key={item.id}
                                className="btn btn-ghost"
                                style={{ fontSize: 11, padding: '6px 10px' }}
                                onClick={() => addToCart(item.id)}
                            >
                                {item.name.split(' ').slice(0, 3).join(' ')}
                            </button>
                        ))}
                    </div>

                    {/* Tabla del carrito */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
                                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Producto</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 12, fontWeight: 600 }}>Cant.</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>P. Unit.</th>
                                    <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600 }}>Subtotal</th>
                                    <th style={{ padding: '10px 8px', width: 40 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                                            <Icon name="shopping_cart" size={48} /><br />
                                            Escaneá o buscá un producto para empezar
                                        </td>
                                    </tr>
                                )}
                                {cart.map(ci => (
                                    <tr key={ci.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '10px 16px' }}>
                                            <strong style={{ fontSize: 13 }}>{ci.name}</strong>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ci.barcode || ci.id}</div>
                                        </td>
                                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 16 }} onClick={() => updateQty(ci.id, -1)}>−</button>
                                                <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{ci.qty}</span>
                                                <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 16 }} onClick={() => updateQty(ci.id, 1)}>+</button>
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13 }}>
                                            {formatCurrency(ci.sell_price)}
                                        </td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                                            {formatCurrency(ci.sell_price * ci.qty)}
                                        </td>
                                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                            <button className="btn btn-ghost" style={{ padding: 4, color: 'var(--danger)' }} onClick={() => removeFromCart(ci.id)}>
                                                <Icon name="delete" size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Columna Derecha: Resumen */}
                <div>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20, position: 'sticky', top: 20 }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Resumen de Venta</h3>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Productos:</span>
                            <span>{cart.reduce((s, ci) => s + ci.qty, 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 13 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Líneas:</span>
                            <span>{cart.length}</span>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '12px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <span style={{ fontSize: 20, fontWeight: 700 }}>TOTAL</span>
                            <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(total)}</span>
                        </div>

                        <FormField label="Método de Pago">
                            <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                                <option value="EFECTIVO">💵 Efectivo</option>
                                <option value="TARJETA">💳 Tarjeta</option>
                                <option value="TRANSFERENCIA">📲 Transferencia</option>
                            </select>
                        </FormField>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '14px 20px', fontSize: 16, width: '100%' }}
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                            >
                                <Icon name="shopping_cart_checkout" size={20} /> COBRAR {formatCurrency(total)}
                            </button>
                            <button
                                className="btn btn-ghost"
                                style={{ padding: '10px 16px', fontSize: 13, width: '100%' }}
                                onClick={handleCancelSale}
                            >
                                Cancelar Venta
                            </button>
                        </div>

                        {/* Última venta */}
                        {lastSale && (
                            <div style={{ marginTop: 20, padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>✅ Última venta</div>
                                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(lastSale.total)}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lastSale.items.length} productos • {lastSale.method}</div>
                                </div>
                                <button className="btn btn-ghost" onClick={() => setPrintSale(lastSale)} title="Reimprimir Ticket">
                                    <Icon name="print" size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showCamera && (
                <CameraScanner onScan={handleCameraScan} onClose={() => setShowCamera(false)} />
            )}

            {printSale && (
                <PrintableSaleTicket sale={printSale} onClose={() => setPrintSale(null)} />
            )}
        </div>
    );
};
