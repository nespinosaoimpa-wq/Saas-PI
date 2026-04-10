import React, { useState, Fragment, useRef, useEffect, useMemo } from 'react';
import { formatCurrency } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
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
    const { data: MOCK, processSale, exportToExcel, posCart: cart, setPosCart: setCart } = useApp();
    const { user } = useAuth();
    const [manualCode, setManualCode] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [payMethod, setPayMethod] = useState('EFECTIVO');
    const [invoiceType, setInvoiceType] = useState('INTERNAL'); // INTERNAL, FACTURA_A, FACTURA_B
    const [customerCuit, setCustomerCuit] = useState('');
    const [lastSale, setLastSale] = useState(null);
    const [printSale, setPrintSale] = useState(null);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
    const [cashierProfitPercent, setCashierProfitPercent] = useState(0);
    const [searchResults, setSearchResults] = useState([]);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState('PERCENT'); // PERCENT or FIXED
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customItem, setCustomItem] = useState({ name: '', price: '' });
    const codeInputRef = useRef(null);
    
    // Client selection states
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    
    // Credit modal states
    const [showCreditModal, setShowCreditModal] = useState(false);
    const [creditInitialStep, setCreditInitialStep] = useState(0); // 0 or 1
    const [creditInitialPayment, setCreditInitialPayment] = useState(0);
    const [creditInterestRate, setCreditInterestRate] = useState(0);
    const [creditFrequency, setCreditFrequency] = useState('LIBRE');
    const [creditNextPaymentDate, setCreditNextPaymentDate] = useState('');

    // Buscar producto por código o nombre o marca
    const findProduct = (term) => {
        if (!term) return null;
        const lowerTerm = term.toString().toLowerCase().trim();
        
        // 1. Priority: Exact match on Barcode or ID
        let match = (MOCK.inventory || []).find(i => 
            (i.barcode && String(i.barcode).toLowerCase() === lowerTerm) ||
            (i.id && String(i.id).toLowerCase() === lowerTerm)
        );
        if (match) return match;

        // 2. Priority: Partial match on Barcode/ID (only if term length >= 3)
        if (lowerTerm.length >= 3) {
            match = (MOCK.inventory || []).find(i => 
                (i.barcode && String(i.barcode).toLowerCase().includes(lowerTerm)) ||
                (i.id && String(i.id).toLowerCase().includes(lowerTerm))
            );
            if (match) return match;
        }

        // 3. Priority: Name or Brand includes term
        return (MOCK.inventory || []).find(i =>
            (i.name && i.name.toLowerCase().includes(lowerTerm)) ||
            (i.brand && i.brand.toLowerCase().includes(lowerTerm))
        );
    };

    // Live search results
    useEffect(() => {
        if (!manualCode.trim() || manualCode.length < 2) {
            setSearchResults([]);
            return;
        }
        const term = manualCode.toLowerCase();
        const results = (MOCK.inventory || []).filter(i => 
            (i.name && i.name.toLowerCase().includes(term)) ||
            (i.brand && i.brand.toLowerCase().includes(term)) ||
            (i.barcode && String(i.barcode).includes(term)) ||
            (i.short_code && String(i.short_code).includes(term))
        ).slice(0, 8);
        setSearchResults(results);
    }, [manualCode, MOCK.inventory]);

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
                return prev.map(ci => ci.id === item.id ? { ...ci, qty: ci.qty + 1, currentPrice: (item.sell_price || 0) * (ci.qty + 1) } : ci);
            }
            return [...prev, { ...item, qty: 1, currentPrice: item.sell_price || 0 }];
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

    const handleAddCustom = () => {
        if (!customItem.name || !customItem.price) return alert('Por favor complete nombre y precio');
        
        const newItem = {
            id: 'manual-' + Date.now(),
            name: customItem.name,
            sell_price: parseFloat(customItem.price),
            qty: 1,
            is_manual: true,
            stock_type: 'UNIT'
        };

        setCart(prev => [...prev, newItem]);
        setShowCustomModal(false);
        setCustomItem({ name: '', price: '' });
    };

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(ci => {
            if (ci.id === id) {
                // Para VOLUME, delta suele ser +/- 1 litro si se usa el botón, pero permitimos decimales
                const newQty = ci.qty + delta;
                return newQty > 0 ? { ...ci, qty: Number(newQty.toFixed(3)) } : ci;
            }
            return ci;
        }));
    };

    const setManualQty = (id, value) => {
        setCart(prev => prev.map(ci => {
            if (ci.id === id) {
                return { ...ci, qty: Number(value) };
            }
            return ci;
        }));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(ci => ci.id !== id));
    };

    const subtotal = cart.reduce((sum, ci) => sum + (ci.sell_price * ci.qty), 0);
    
    // Calcular Descuento
    const discountAmount = discountType === 'PERCENT' 
        ? (subtotal * (discountValue / 100)) 
        : Math.min(discountValue, subtotal);
    
    const discountedSubtotal = subtotal - discountAmount;
    const extraProfit = discountedSubtotal * (cashierProfitPercent / 100);
    const total = discountedSubtotal + extraProfit;

    const filteredClients = useMemo(() => {
        if (!clientSearch) return [];
        const term = clientSearch.toLowerCase();
        return (MOCK.clients || []).filter(client => 
            `${client.first_name} ${client.last_name} ${client.dni}`.toLowerCase().includes(term)
        ).slice(0, 5);
    }, [clientSearch, MOCK.clients]);

    const handleCheckout = async () => {
        if (cart.length === 0) return alert('El carrito está vacío');
        
        if (payMethod === 'CREDITO_CASA' && !selectedClient) {
            return alert('Debe seleccionar un CLIENTE para realizar una venta con Crédito de la Casa');
        }

        if (payMethod === 'CREDITO_CASA' && !showCreditModal) {
            setCreditInitialPayment(0);
            setCreditInterestRate(0);
            setCreditNextPaymentDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            setShowCreditModal(true);
            return;
        }

        setIsCheckoutLoading(true);
        let afipData = null;

        try {
            if (invoiceType === 'FACTURA_A' || invoiceType === 'FACTURA_B') {
                if (invoiceType === 'FACTURA_A' && (!customerCuit || customerCuit.length < 11)) {
                    throw new Error('Debe ingresar un CUIT válido para Factura A');
                }

                afipData = await MOCK.generateAFIPInvoice({
                    amount: total,
                    docType: invoiceType === 'FACTURA_A' ? 80 : 99,
                    docNumber: invoiceType === 'FACTURA_A' ? customerCuit : 0,
                    billType: invoiceType === 'FACTURA_A' ? 1 : 6
                });
            }

            const saleTotal = await processSale(cart, payMethod, afipData ? {
                cae: afipData.cae,
                cae_due_date: afipData.caeDueDate,
                receipt_number: afipData.receiptText
            } : null, user?.id, extraProfit, payMethod === 'CREDITO_CASA' ? {
                client_id: selectedClient.id,
                initial_payment: creditInitialPayment,
                interest_rate: creditInterestRate,
                payment_frequency: creditFrequency,
                next_payment_date: creditNextPaymentDate
            } : null);

            const saleData = {
                items: [...cart],
                total: saleTotal,
                method: payMethod,
                date: new Date(),
                afip: afipData
            };

            setLastSale(saleData);
            setPrintSale(saleData);
            setCart([]);
            setInvoiceType('INTERNAL');
            setCashierProfitPercent(0);
            setDiscountValue(0);
            setSelectedClient(null);
            setClientSearch('');
            setShowCreditModal(false);
        } catch (error) {
            alert('Error en la transacción: ' + error.message);
        } finally {
            setIsCheckoutLoading(false);
        }
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
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input
                                ref={codeInputRef}
                                className="form-input"
                                placeholder="Escanear código o buscar producto..."
                                value={manualCode}
                                onChange={e => setManualCode(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                                style={{ width: '100%', fontSize: 16, padding: '12px 16px' }}
                                autoFocus
                                title="Escribe el código de barras o nombre del producto y presiona Enter"
                            />
                            {/* Live Search Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="glass-card" style={{ 
                                    position: 'absolute', top: '100%', left: 0, right: 0, 
                                    zIndex: 100, marginTop: 4, padding: 8,
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                                    maxHeight: 400, overflowY: 'auto'
                                }}>
                                    {searchResults.map(p => (
                                        <div 
                                            key={p.id} 
                                            className="nav-item" 
                                            style={{ 
                                                padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                            onClick={() => {
                                                addToCart(p.barcode || p.id);
                                                setManualCode('');
                                                setSearchResults([]);
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand} | Stock: {p.stock_type === 'UNIT' ? p.stock_quantity : (p.stock_ml/1000).toFixed(1)+'L'}</div>
                                            </div>
                                            <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>{formatCurrency(p.sell_price)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="btn btn-primary" onClick={handleManualAdd} style={{ padding: '12px 20px' }} title="Agregar producto al carrito manualmente">
                            <Icon name="add_shopping_cart" size={20} /> Agregar
                        </button>
                        <button className="btn btn-ghost" onClick={() => setShowCamera(true)} style={{ padding: '12px 16px' }} title="Escanear código de barras con la cámara">
                            <Icon name="photo_camera" size={20} />
                        </button>
                        <button className="btn btn-warning" onClick={() => setShowCustomModal(true)} style={{ padding: '12px 20px', fontWeight: 700 }} title="Agregar producto manual (No existe en stock)">
                            <Icon name="add" size={20} /> Especial
                        </button>
                    </div>

                    {/* Selector de Cliente para Crédito/Venta Nominal */}
                    <div style={{ marginBottom: 16, position: 'relative' }}>
                        {selectedClient ? (
                            <div style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Icon name="person" size={20} style={{ color: 'var(--primary)' }} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedClient.first_name} {selectedClient.last_name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DNI: {selectedClient.dni}</div>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-ghost" onClick={() => { setSelectedClient(null); setClientSearch(''); }} style={{ color: 'var(--danger)' }}>
                                    <Icon name="close" size={16} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <Icon name="search" size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                <input
                                    className="form-input"
                                    placeholder="Buscar cliente para Crédito de la Casa... (Nombre o DNI)"
                                    value={clientSearch}
                                    onChange={e => setClientSearch(e.target.value)}
                                    style={{ paddingLeft: 40, width: '100%' }}
                                />
                                {clientSearch && filteredClients.length > 0 && (
                                    <div className="glass-card" style={{ 
                                        position: 'absolute', top: '100%', left: 0, right: 0, 
                                        zIndex: 100, marginTop: 4, padding: 8,
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                                    }}>
                                        {filteredClients.map(c => (
                                            <div 
                                                key={c.id} 
                                                className="nav-item" 
                                                style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                                                onClick={() => {
                                                    setSelectedClient(c);
                                                    setClientSearch('');
                                                }}
                                            >
                                                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.first_name} {c.last_name}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>DNI: {c.dni}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
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
                                            {ci.stock_type === 'VOLUME' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                                                    <select 
                                                        className="form-select" 
                                                        style={{ padding: '2px 4px', fontSize: 11, height: 28, minWidth: 80 }}
                                                        value={ci.qty === 0.5 || ci.qty === 1 || ci.qty === 1.5 || ci.qty === 4 ? ci.qty : 'custom'}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === 'custom') {
                                                                const type = confirm('Haga clic en ACEPTAR para ingresar MILILITROS o CANCELAR para ingresar DINERO ($)') ? 'ML' : 'MONEY';
                                                                if (type === 'ML') {
                                                                    const ml = prompt('Ingrese cantidad en mililitros (ej: 750):', (ci.qty * 1000).toString());
                                                                    if (ml && !isNaN(ml)) setManualQty(ci.id, parseFloat(ml) / 1000);
                                                                } else {
                                                                    const money = prompt('Ingrese el monto en DINERO ($) deseado (ej: 5000):');
                                                                    if (money && !isNaN(money)) {
                                                                        const calculatedQty = parseFloat(money) / (ci.sell_price || 1);
                                                                        setManualQty(ci.id, calculatedQty);
                                                                    }
                                                                }
                                                            } else {
                                                                setManualQty(ci.id, parseFloat(val));
                                                            }
                                                        }}
                                                    >
                                                        <option value={0.5}>500 ml</option>
                                                        <option value={1}>1 Litro</option>
                                                        <option value={1.5}>1.5 Litros</option>
                                                        <option value={4}>4 Litros</option>
                                                        <option value="custom">Personalizado...</option>
                                                    </select>
                                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)' }}>
                                                        {(ci.qty * 1000).toFixed(0)} ml
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                    <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 16 }} onClick={() => updateQty(ci.id, -1)}>−</button>
                                                    <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{ci.qty}</span>
                                                    <button className="btn btn-ghost" style={{ padding: '2px 6px', fontSize: 16 }} onClick={() => updateQty(ci.id, 1)}>+</button>
                                                </div>
                                            )}
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

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                                <span style={{ color: 'var(--text-muted)' }}>Descuento:</span>
                                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                    <select 
                                        className="form-select" 
                                        style={{ width: 45, padding: '2px 4px', height: 24, fontSize: 10 }}
                                        value={discountType}
                                        onChange={e => setDiscountType(e.target.value)}
                                    >
                                        <option value="PERCENT">%</option>
                                        <option value="FIXED">$</option>
                                    </select>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        style={{ width: 60, padding: '2px 4px', height: 24, fontSize: 12, textAlign: 'right' }} 
                                        value={discountValue} 
                                        onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                                <span style={{ color: 'var(--text-muted)' }}>% Ganancia Cajero:</span>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    style={{ width: 60, padding: '2px 4px', height: 24, fontSize: 12, textAlign: 'right' }} 
                                    value={cashierProfitPercent} 
                                    onChange={e => setCashierProfitPercent(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                                <span style={{ fontSize: 20, fontWeight: 700 }}>TOTAL</span>
                                <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <FormField label="Método de Pago" style={{ marginTop: 12 }}>
                            <select className="form-select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                                <option value="EFECTIVO">💵 Efectivo</option>
                                <option value="TARJETA">💳 Tarjeta</option>
                                <option value="TRANSFERENCIA">📲 Transferencia</option>
                                <option value="CREDITO_CASA">🏠 Crédito de la Casa</option>
                            </select>
                        </FormField>

                        <FormField label="Tipo de Comprobante" style={{ marginTop: 12 }}>
                            <select className="form-select" value={invoiceType} onChange={e => setInvoiceType(e.target.value)}>
                                <option value="INTERNAL">📄 Ticket Interno (No Fiscal)</option>
                                <option value="FACTURA_B">🧾 Factura B (Electrónica AFIP)</option>
                                <option value="FACTURA_A">🏢 Factura A (Responsable Inscripto)</option>
                            </select>
                        </FormField>

                        {invoiceType === 'FACTURA_A' && (
                            <FormField label="CUIT del Cliente" style={{ marginTop: 12 }}>
                                <input
                                    className="form-input"
                                    placeholder="Ej: 20123456789"
                                    value={customerCuit}
                                    onChange={e => setCustomerCuit(e.target.value.replace(/\D/g, ''))}
                                    maxLength={11}
                                />
                            </FormField>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '14px 20px', fontSize: 16, width: '100%', opacity: isCheckoutLoading ? 0.7 : 1 }}
                                onClick={handleCheckout}
                                disabled={cart.length === 0 || isCheckoutLoading}
                            >
                                <Icon name={isCheckoutLoading ? "hourglass_empty" : "shopping_cart_checkout"} size={20} />
                                {isCheckoutLoading ? 'PROCESANDO...' : `COBRAR ${formatCurrency(total)}`}
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

            {showCreditModal && (
                <Modal 
                    title="Planificación de Crédito de la Casa" 
                    onClose={() => setShowCreditModal(false)}
                    footer={
                        <Fragment>
                            <button className="btn btn-ghost" onClick={() => setShowCreditModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleCheckout}>Confirmar y Cobrar</button>
                        </Fragment>
                    }
                >
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ padding: 12, background: 'var(--primary-light)', borderRadius: 'var(--radius)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', fontSize: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
                            <Icon name="info" size={20} />
                            <div>
                                <strong>Venta a Crédito:</strong> Estás por registrar una deuda para <strong>{selectedClient?.first_name} {selectedClient?.last_name}</strong> por un total de <strong>{formatCurrency(total)}</strong>.
                            </div>
                        </div>

                        <FormRow>
                            <FormField label="Pago Inicial (Entrega)">
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={creditInitialPayment} 
                                    onChange={e => setCreditInitialPayment(parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                />
                            </FormField>
                            <FormField label="% Interés">
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={creditInterestRate} 
                                    onChange={e => setCreditInterestRate(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                />
                            </FormField>
                        </FormRow>

                        <FormRow>
                            <FormField label="Frecuencia de Pago">
                                <select className="form-select" value={creditFrequency} onChange={e => setCreditFrequency(e.target.value)}>
                                    <option value="LIBRE">Libre (Sin fecha fija)</option>
                                    <option value="SEMANAL">Semanal (Cada 7 días)</option>
                                    <option value="QUINCENAL">Quincenal (Cada 15 días)</option>
                                    <option value="MENSUAL">Mensual (Cada 30 días)</option>
                                </select>
                            </FormField>
                            <FormField label="Próxima Fecha de Pago">
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    value={creditNextPaymentDate} 
                                    onChange={e => setCreditNextPaymentDate(e.target.value)}
                                />
                            </FormField>
                        </FormRow>

                        <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Monto de Venta:</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Intereses ({creditInterestRate}%):</span>
                                <span>{formatCurrency(total * (creditInterestRate / 100))}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Entrega Inicial:</span>
                                <span style={{ color: 'var(--success)', fontWeight: 600 }}>- {formatCurrency(creditInitialPayment)}</span>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                                <span>SALDO DEUDA:</span>
                                <span style={{ color: 'var(--danger)' }}>{formatCurrency((total * (1 + creditInterestRate / 100)) - creditInitialPayment)}</span>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {showCustomModal && (
                <Modal title="Agregar Producto Manual" onClose={() => setShowCustomModal(false)} footer={
                    <Fragment>
                        <button className="btn btn-ghost" onClick={() => setShowCustomModal(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleAddCustom}>Agregar al Carrito</button>
                    </Fragment>
                }>
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                            Use esta opción para productos que no están en el inventario o servicios ocasionales.
                        </p>
                        <FormField label="Nombre del Producto / Servicio">
                            <input 
                                className="form-input" 
                                placeholder="Ej: 2 Cubiertas Usadas + Colocación" 
                                value={customItem.name}
                                onChange={e => setCustomItem({...customItem, name: e.target.value})}
                                autoFocus
                            />
                        </FormField>
                        <FormField label="Precio de Venta ($)">
                            <input 
                                type="number"
                                className="form-input" 
                                placeholder="0.00" 
                                value={customItem.price}
                                onChange={e => setCustomItem({...customItem, price: e.target.value})}
                            />
                        </FormField>
                    </div>
                </Modal>
            )}
        </div>
    );
};

