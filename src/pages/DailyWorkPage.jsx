import React, { useState } from 'react';
import { formatCurrency, MOCK as STATIC_MOCK } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SectionHeader, GlassCard, StatusBadge, CheckItem, Icon, Modal, FormField, FormRow } from '../components/ui';

export const DailyWorkPage = () => {
    const { data: MOCK, getClient, getVehicle, updateWorkOrder, addQuickService, getCommissions } = useApp();
    const { user } = useAuth();

    const myOrders = MOCK.workOrders.filter(wo => wo.status === 'En Box');
    // Using user.id as per the user's latest update in saas-app
    const commissions = user ? getCommissions(user.id) : 0;

    const [editingAction, setEditingAction] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [lastTicket, setLastTicket] = useState(null);
    const [gomeriaQueue, setGomeriaQueue] = useState([]);
    const [selectedQueueClient, setSelectedQueueClient] = useState(null);
    const [newQueueName, setNewQueueName] = useState('');

    // Custom Service State
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customService, setCustomService] = useState({ label: '', price: '' });

    // Express POS State
    const [showExpressPOS, setShowExpressPOS] = useState(false);
    const [posSearch, setPosSearch] = useState('');

    // Button Config State
    const [configAction, setConfigAction] = useState(null); // Action being edited (icon/label/price)
    const [showNewActionModal, setShowNewActionModal] = useState(false);

    // OT Interactivity States
    const [checklistState, setChecklistState] = useState({});
    const [observationsState, setObservationsState] = useState({});

    // Carrito de Servicios Gomería
    const [cart, setCart] = useState([]);
    const [manualDiscount, setManualDiscount] = useState(0);

    const toggleCheck = (woId, itemKey) => {
        setChecklistState(prev => {
            const current = prev[woId] || [];
            if (current.includes(itemKey)) {
                return { ...prev, [woId]: current.filter(k => k !== itemKey) };
            }
            return { ...prev, [woId]: [...current, itemKey] };
        });
    };

    const [finalizeOT, setFinalizeOT] = useState(null);
    const [otPaymentMethod, setOtPaymentMethod] = useState('EFECTIVO');
    const [otCombinedAmounts, setOtCombinedAmounts] = useState({ EFECTIVO: '', TRANSFERENCIA: '', CREDITO: '', DEBITO: '' });

    const handlePhotoCapture = (woId, file) => {
        if (!file) return;
        alert(`📸 Foto capturada correctamente para la OT. Guardada como: ${file.name}`);
    };

    const handleFinishClick = (id) => {
        setFinalizeOT(id);
        setOtPaymentMethod('EFECTIVO');
        setOtCombinedAmounts({ EFECTIVO: '', TRANSFERENCIA: '', CREDITO: '', DEBITO: '' });
    };

    const confirmFinalizeOT = () => {
        if (!finalizeOT) return;
        const updates = {
            status: 'Finalizado',
            completed_at: new Date().toISOString()
        };
        if (observationsState[finalizeOT]) {
            updates.mechanic_notes = observationsState[finalizeOT];
        }
        updateWorkOrder(finalizeOT, updates, {
            method: otPaymentMethod,
            combinedAmounts: otPaymentMethod === 'COMBINADO' ? otCombinedAmounts : null
        });
        setFinalizeOT(null);
    };

    const DEFAULT_QUICK_ACTIONS = [
        { id: 'qa1', label: 'Parche Moto', icon: 'tire_repair', price: 2500, color: 'var(--primary)' },
        { id: 'qa2', label: 'Parche Auto', icon: 'tire_repair', price: 3500, color: 'var(--primary)' },
        { id: 'qa3', label: 'Inflado / Aire', icon: 'air', price: 0, color: 'var(--success)' },
        { id: 'qa4', label: 'Ajuste Cadena', icon: 'settings_suggest', price: 1500, color: 'var(--warning)' },
        { id: 'qa5', label: 'Lubric. Cadena', icon: 'oil_barrel', price: 1000, color: 'var(--accent)' },
        { id: 'qa6', label: 'Repar. Cámara', icon: 'build', price: 2800, color: 'var(--danger)' },
    ];

    // Load custom prices from localStorage
    const [quickActions, setQuickActions] = useState(() => {
        try {
            const saved = localStorage.getItem('piripi_quick_actions');
            return saved ? JSON.parse(saved) : DEFAULT_QUICK_ACTIONS;
        } catch { return DEFAULT_QUICK_ACTIONS; }
    });

    const [pendingAction, setPendingAction] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
    const [selectedMechanicId, setSelectedMechanicId] = useState(user?.role === 'mechanic' || user?.role === 'gomero' ? user.id : '');
    const [combinedAmounts, setCombinedAmounts] = useState({ EFECTIVO: '', TRANSFERENCIA: '', TARJETA: '' });

    const initiateQuickAction = (action) => {
        // Allow adding to cart even if no client is selected (Anonymous mode)
        const alreadyHas = (selectedQueueClient?.services.some(s => s.id === action.id)) || cart.some(s => s.id === action.id);
        const finalPrice = alreadyHas ? action.price * 0.5 : action.price;
        
        setCart(prev => [...prev, { ...action, currentPrice: finalPrice, isDiscounted: alreadyHas }]);
    };

    const removeFromCart = (index) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const openPaymentModal = () => {
        if (cart.length === 0) return;
        setPendingAction({ label: 'Carrito de Servicios', price: cart.reduce((s, item) => s + item.currentPrice, 0) });
        setPaymentMethod('EFECTIVO');
        setCombinedAmounts({ EFECTIVO: '', TRANSFERENCIA: '', TARJETA: '' });
        setManualDiscount(0);
        setSelectedMechanicId(user?.role === 'mechanic' || user?.role === 'gomero' ? user.id : '');
    };

    const confirmQuickAction = () => {
        if (cart.length === 0) return;
        
        const subtotal = cart.reduce((s, item) => s + item.currentPrice, 0);
        const discountAmount = subtotal * (manualDiscount / 100);
        const finalTotal = subtotal - discountAmount;

        if (finalTotal > 0 && paymentMethod === 'COMBINADO') {
            const tEfectivo = parseFloat(combinedAmounts.EFECTIVO) || 0;
            const tTransf = parseFloat(combinedAmounts.TRANSFERENCIA) || 0;
            const tTarjeta = parseFloat(combinedAmounts.TARJETA) || 0;
            if (Math.abs((tEfectivo + tTransf + tTarjeta) - finalTotal) > 1) {
                alert(`La suma de los montos combinados debe ser igual al total (${formatCurrency(finalTotal)}).`);
                return;
            }
        }

        // Registrar cada servicio del carrito (o uno consolidado, según prefieras)
        // Por simplicidad para el historial, registramos uno consolidado con el detalle
        const labels = cart.map(c => c.label).join(', ');
        
        addQuickService(
            { id: 'cart', label: labels, price: subtotal }, 
            false, 
            selectedMechanicId || user?.id,
            selectedQueueClient?.client_id || null,
            selectedQueueClient?.vehicle_id || null,
            { method: paymentMethod, combinedAmounts: paymentMethod === 'COMBINADO' ? combinedAmounts : null },
            finalTotal 
        );

        if (selectedQueueClient) {
            setGomeriaQueue(prev => prev.map(q => {
                if (q.id === selectedQueueClient.id) {
                    return { ...q, services: [...q.services, ...cart] };
                }
                return q;
            }));
            setSelectedQueueClient(prev => ({ ...prev, services: [...prev.services, ...cart] }));
        }

        setLastTicket({
            id: `T-${Date.now()}`,
            label: labels,
            price: finalTotal,
            timestamp: new Date().toLocaleString('es-AR')
        });

        setCart([]);
        setPendingAction(null);
        setShowTicketModal(true);
    };

    const handleQuickAction = (action) => {
        initiateQuickAction(action);
    };

    const addToCartFromPOS = (product) => {
        const action = {
            id: product.id,
            label: product.name,
            price: product.sell_price,
            icon: 'inventory_2',
            color: 'var(--primary)',
            inventory_item: product // Mark as inventory item
        };
        initiateQuickAction(action);
        setPosSearch('');
        setShowExpressPOS(false);
    };

    const filteredPOSProducts = (MOCK.inventory || []).filter(p => {
        if (!posSearch) return false;
        const term = posSearch.toLowerCase();
        return p.name.toLowerCase().includes(term) || 
               (p.brand && p.brand.toLowerCase().includes(term)) ||
               (p.barcode && p.barcode.toString().includes(term));
    }).slice(0, 6);

    const addToQueue = () => {
        if (!newQueueName.trim()) return;
        const newItem = { id: Date.now(), name: newQueueName, services: [] };
        setGomeriaQueue(prev => [...prev, newItem]);
        setNewQueueName('');
        if (!selectedQueueClient) setSelectedQueueClient(newItem);
    };

    const removeFromQueue = (id) => {
        setGomeriaQueue(prev => prev.filter(q => q.id !== id));
        if (selectedQueueClient?.id === id) {
            setSelectedQueueClient(null);
            setCart([]);
        }
    };

    const openEditPrice = (action) => {
        setEditingAction(action);
        setEditPrice(action.price.toString());
    };

    const saveEditPrice = () => {
        if (!editingAction) return;
        const newPrice = parseFloat(editPrice) || 0;
        const updated = quickActions.map(a => a.id === editingAction.id ? { ...a, price: newPrice } : a);
        setQuickActions(updated);
        localStorage.setItem('piripi_quick_actions', JSON.stringify(updated));
        setEditingAction(null);
    };

    const saveConfigAction = (updatedAction) => {
        const updated = quickActions.map(a => a.id === updatedAction.id ? updatedAction : a);
        setQuickActions(updated);
        localStorage.setItem('piripi_quick_actions', JSON.stringify(updated));
        setConfigAction(null);
    };

    const addNewAction = (newAction) => {
        const updated = [...quickActions, { ...newAction, id: `qa-${Date.now()}` }];
        setQuickActions(updated);
        localStorage.setItem('piripi_quick_actions', JSON.stringify(updated));
        setShowNewActionModal(false);
    };

    const removeAction = (id) => {
        if (window.confirm('¿Eliminar este botón permanente?')) {
            const updated = quickActions.filter(a => a.id !== id);
            setQuickActions(updated);
            localStorage.setItem('piripi_quick_actions', JSON.stringify(updated));
        }
    };

    const handleCustomSubmit = () => {
        if (!customService.label.trim() || customService.price === '') return alert('Complete nombre y precio del servicio');
        const priceNum = parseFloat(customService.price) || 0;
        handleQuickAction({
            id: `custom-${Date.now()}`,
            label: customService.label,
            price: priceNum,
            icon: 'build_circle',
            color: 'var(--primary)'
        });
        setShowCustomModal(false);
        setCustomService({ label: '', price: '' });
    };

    const printTicket = () => {
        if (!lastTicket) return;
        const printWindow = window.open('', '_blank', 'width=320,height=500');
        printWindow.document.write(`
            <html><head><title>Ticket</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; margin: 0; font-size: 12px; }
                .line { border-top: 1px dashed #000; margin: 10px 0; }
                h2 { margin: 5px 0; font-size: 16px; }
                .price { font-size: 22px; font-weight: bold; margin: 10px 0; }
            </style></head>
            <body>
                <h2>PIRIPI PRO</h2>
                <p>Lubricentro & Gomería</p>
                <div class="line"></div>
                <p><strong>SERVICIO EXPRESS</strong></p>
                <p>${lastTicket.label}</p>
                <div class="price">$${lastTicket.price.toLocaleString('es-AR')}</div>
                <div class="line"></div>
                <p>Ticket: ${lastTicket.id}</p>
                <p>${lastTicket.timestamp}</p>
                <p>Operador: ${user?.name || user?.full_name || 'Admin'}</p>
                <div class="line"></div>
                <p style="font-size:10px;">¡Gracias por su confianza!</p>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
    };

    return (
        <div className="page-content">
            <div className="page-grid grid-2col">
                {/* My Orders */}
                <div>
                    <SectionHeader icon="engineering" title="Mis Trabajos: Órdenes Activas" right={
                        <span className="nav-badge alert">{myOrders.length} ACTIVOS</span>
                    } />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {myOrders.map(wo => {
                            const client = getClient(wo.client_id);
                            const vehicle = getVehicle(wo.vehicle_id);
                            return (
                                <GlassCard key={wo.id} style={{ padding: 24, borderLeft: '4px solid var(--primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                                                ORDEN DE TRABAJO #{wo.order_number}
                                            </div>
                                            <h4 style={{ fontSize: 18, fontWeight: 800 }}>{vehicle?.brand} {vehicle?.model}</h4>
                                            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                                                {vehicle?.license_plate} • {client?.first_name} {client?.last_name}
                                            </p>
                                        </div>
                                        <StatusBadge status={wo.status} />
                                    </div>

                                    <div style={{ background: 'var(--bg-hover)', padding: 14, borderRadius: 'var(--radius-sm)', marginBottom: 16, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>Trabajo a realizar:</div>
                                        <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>{wo.description}</p>
                                    </div>

                                    <SectionHeader icon="checklist" title="Control de Tareas" />
                                    <div className="grid-2col-even" style={{ marginBottom: 20 }}>
                                        {(STATIC_MOCK.checklist_template || []).slice(0, 6).map(item => (
                                            <CheckItem
                                                key={item.key}
                                                label={item.label}
                                                sub={item.group}
                                                checked={(checklistState[wo.id] || []).includes(item.key)}
                                                onChange={() => toggleCheck(wo.id, item.key)}
                                            />
                                        ))}
                                    </div>
                                    <div style={{ marginBottom: 20 }}>
                                        <textarea
                                            className="form-input"
                                            placeholder="Observaciones del mecánico (opcional)..."
                                            style={{ minHeight: 60, fontSize: 13 }}
                                            value={observationsState[wo.id] || ''}
                                            onChange={(e) => setObservationsState(prev => ({ ...prev, [wo.id]: e.target.value }))}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        { !['mecanico', 'gomero'].includes(user?.role || 'mecanico') && (
                                            <button className="btn btn-success" style={{ flex: 1, height: 46, fontSize: 14, fontWeight: 700 }} onClick={() => handleFinishClick(wo.id)} title="Finalizar el trabajo y registrar cobro">
                                                <Icon name="check_circle" size={20} /> FINALIZAR TRABAJO
                                            </button>
                                        )}
                                        <label className="btn btn-ghost" style={{ width: 46, height: 46, padding: 0, justifyContent: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Tomar foto del trabajo para el registro histórico">
                                            <Icon name="photo_camera" size={20} />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                style={{ display: 'none' }}
                                                onChange={(e) => handlePhotoCapture(wo.id, e.target.files[0])}
                                            />
                                        </label>
                                    </div>
                                </GlassCard>
                            );
                        })}

                        {myOrders.length === 0 && (
                            <GlassCard style={{ padding: 40, textAlign: 'center' }}>
                                <Icon name="sentiment_satisfied" size={48} style={{ color: 'var(--text-disabled)', marginBottom: 16 }} />
                                <h3>No tienes órdenes activas</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Mantené la sección despejada para nuevos trabajos.</p>
                            </GlassCard>
                        )}
                    </div>
                </div>

                {/* Gomería — Quick Services */}
                { user?.role !== 'mecanico' && (
                <div>
                    <SectionHeader icon="tire_repair" title="Gomería: Registro Rápido" right={
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>MÓDULO EXPRESS</span>
                    } />

                    {/* Cola de Espera Gomería */}
                    <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
                        <SectionHeader icon="groups" title="Cola de Espera" />
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            <input className="form-input" placeholder="Nombre de cliente/Vehículo..." value={newQueueName} onChange={e => setNewQueueName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addToQueue()} />
                            <button className="btn btn-primary btn-sm" onClick={addToQueue}>Agregar</button>
                        </div>
                        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                             {gomeriaQueue.map(q => (
                                <div key={q.id}
                                    onClick={() => setSelectedQueueClient(q)}
                                    className={`nav-item ${selectedQueueClient?.id === q.id ? 'active' : ''}`}
                                    style={{
                                        padding: '8px 14px', borderRadius: 'var(--radius)',
                                        whiteSpace: 'nowrap', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        border: selectedQueueClient?.id === q.id ? '2px solid var(--primary)' : '1px solid var(--border)'
                                    }}>
                                    <span>{q.name}</span>
                                    {q.services.length > 0 && <span className="nav-badge">{q.services.length}</span>}
                                    <button onClick={(e) => { e.stopPropagation(); removeFromQueue(q.id); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: 0 }}>&times;</button>
                                </div>
                            ))}
                            {gomeriaQueue.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No hay clientes en espera</div>}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 20 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                            {selectedQueueClient ? (
                                <span>Registrando para: <strong>{selectedQueueClient.name}</strong>.</span>
                            ) : (
                                <span>Modo Express: Sumá servicios al carrito directamente.</span>
                            )}
                        </p>

                        {/* Cart View */}
                        {cart.length > 0 && (
                            <div style={{ background: 'rgba(var(--primary-rgb), 0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(var(--primary-rgb), 0.1)', marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>CARRITO DE SERVICIOS</div>
                                    {selectedQueueClient && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Para: {selectedQueueClient.name}</span>}
                                </div>
                                {cart.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 4 }}>
                                        <span>{item.label} {item.isDiscounted && <small style={{ color: 'var(--success)', fontWeight: 700 }}>(50% desc)</small>}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <strong>{formatCurrency(item.currentPrice)}</strong>
                                            <button onClick={() => removeFromCart(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}>
                                                <Icon name="delete" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>Total: {formatCurrency(cart.reduce((s, i) => s + i.currentPrice, 0))}</div>
                                    <button className="btn btn-primary btn-sm" onClick={openPaymentModal}>FINALIZAR Y COBRAR</button>
                                </div>
                            </div>
                        )}

                        <div className="quick-action-grid">
                            {quickActions.map(action => (
                                <div
                                    key={action.id}
                                    className="quick-action-card"
                                    onClick={() => handleQuickAction(action)}
                                    title="Clic izquierdo: Registrar | Clic derecho: Editar Precio"
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        openEditPrice(action);
                                    }}
                                >
                                    {/* Botón de Ajustes (absoluto) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfigAction(action); }}
                                        style={{
                                            position: 'absolute', top: 6, right: 6,
                                            background: 'var(--bg-base)', border: 'none',
                                            borderRadius: '50%', width: 24, height: 24,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: 'var(--text-muted)'
                                        }}
                                        title="Configurar botón (Nombre, Icono, Precio)"
                                    >
                                        <Icon name="settings" size={14} />
                                    </button>

                                    <Icon name={action.icon} size={28} style={{ color: action.color, marginBottom: 8 }} />
                                    <div className="quick-action-label">{action.label}</div>
                                    <div style={{ fontSize: 11, color: action.price > 0 ? 'var(--text-primary)' : 'var(--success)', fontWeight: 700, marginTop: 4 }}>
                                        {action.price > 0 ? formatCurrency(action.price) : 'GRATIS'}
                                    </div>
                                    
                                </div>
                            ))}

                            {/* Botón de Venta POS Express */}
                            <div
                                className="quick-action-card"
                                onClick={() => setShowExpressPOS(true)}
                                style={{ border: '2px solid var(--accent)', background: 'rgba(var(--accent-rgb), 0.05)' }}
                                title="Buscar y agregar un producto del inventario directamente"
                            >
                                <Icon name="inventory_2" size={28} style={{ color: 'var(--accent)', marginBottom: 8 }} />
                                <div className="quick-action-label" style={{ color: 'var(--accent)' }}>+ PRODUCTO</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Desde Inventario</div>
                            </div>

                            {/* Botón de Servicio Libre */}
                            <div
                                className="quick-action-card"
                                onClick={() => setShowCustomModal(true)}
                                style={{ border: '2px dashed var(--primary)', background: 'transparent' }}
                                title="Registrar un servicio con precio y descripción personalizados"
                            >
                                <Icon name="add" size={28} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                                <div className="quick-action-label" style={{ color: 'var(--primary)' }}>Servicio Libre</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Precio Variable</div>
                            </div>

                            {/* Botón de Agregar Nuevo Botón Fijo */}
                            <div
                                className="quick-action-card"
                                onClick={() => setShowNewActionModal(true)}
                                style={{ border: '1px dashed var(--border)', background: 'transparent', opacity: 0.6 }}
                                title="Agregar un nuevo botón fijo a este panel"
                            >
                                <Icon name="add_to_photos" size={24} style={{ color: 'var(--text-muted)', marginBottom: 4 }} />
                                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>MÁS BOTONES</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 20, padding: 14, background: 'rgba(var(--primary-rgb), 0.04)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Icon name="history" style={{ color: 'var(--primary)' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>Actividad Reciente</div>
                                    {(MOCK.activityLog || []).length > 0 ? (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {MOCK.activityLog[0].label} — {formatCurrency(MOCK.activityLog[0].price)} (Ahora)
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sin actividad reciente</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{ marginTop: 16, padding: 20 }}>
                        <SectionHeader icon="payments" title="Mis Comisiones" />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div>
                                <div style={{ fontSize: 28, fontWeight: 800 }}>{formatCurrency(commissions)}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Acumulado este mes</div>
                            </div>
                            <button className="btn btn-sm btn-ghost" title="Ver detalle de comisiones">Detalle</button>
                        </div>
                        <div className="stat-bar" style={{ height: 5, marginTop: 14 }}>
                            <div className="stat-bar-fill" style={{ width: '65%' }}></div>
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* Modal de Pago Express */}
            {pendingAction && (
                <Modal title={`Cobrar Servicio: ${pendingAction.label}`} onClose={() => setPendingAction(null)} footer={
                    <React.Fragment>
                        <button className="btn btn-ghost" onClick={() => setPendingAction(null)}>Cancelar</button>
                        <button className="btn btn-success" onClick={confirmQuickAction} title="Confirmar el cobro y generar el ticket">Confirmar y Ticket</button>
                    </React.Fragment>
                }>
                    <div style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Monto a Cobrar</div>
                                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>
                                    {formatCurrency(
                                        (() => {
                                            const sub = cart.reduce((s, i) => s + i.currentPrice, 0);
                                            return sub - (sub * (manualDiscount / 100));
                                        })()
                                    )}
                                </div>
                                {manualDiscount > 0 && (
                                    <div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>
                                        -{manualDiscount}% descuento aplicado
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right', width: 100 }}>
                                <FormField label="Desc. Extra (%)">
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        min="0" 
                                        max="100" 
                                        value={manualDiscount} 
                                        onChange={e => setManualDiscount(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                        style={{ textAlign: 'center' }}
                                    />
                                </FormField>
                            </div>
                        </div>
                    </div>
                    <FormField label="Forma de Pago">
                        <select className="form-select" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                            <option value="EFECTIVO">Efectivo 💵</option>
                            <option value="TRANSFERENCIA">Transferencia 📱</option>
                            <option value="TARJETA">Tarjeta (Débito/Crédito) 💳</option>
                            <option value="COMBINADO">Combinado (Varias Formas) 🔀</option>
                        </select>
                    </FormField>

                    <FormField label="¿Qué Gomero realizó el trabajo?">
                        <select 
                            className="form-select" 
                            value={selectedMechanicId} 
                            onChange={e => setSelectedMechanicId(e.target.value)}
                        >
                            <option value="">Seleccionar Gomero...</option>
                            {(MOCK.employees || [])
                                .filter(e => e.role === 'mechanic' || e.role === 'gomero' || e.role === 'admin' || !e.role)
                                .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
                                .map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.full_name || emp.name}</option>
                                ))}
                        </select>
                    </FormField>

                    {paymentMethod === 'COMBINADO' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16, padding: 16, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Ingresá los montos de cada método:</div>
                            <FormField label="Monto en Efectivo">
                                <input type="number" className="form-input" placeholder="0" value={combinedAmounts.EFECTIVO} onChange={e => setCombinedAmounts(prev => ({ ...prev, EFECTIVO: e.target.value }))} />
                            </FormField>
                            <FormField label="Monto en Transferencia">
                                <input type="number" className="form-input" placeholder="0" value={combinedAmounts.TRANSFERENCIA} onChange={e => setCombinedAmounts(prev => ({ ...prev, TRANSFERENCIA: e.target.value }))} />
                            </FormField>
                            <FormField label="Monto en Tarjeta">
                                <input type="number" className="form-input" placeholder="0" value={combinedAmounts.TARJETA} onChange={e => setCombinedAmounts(prev => ({ ...prev, TARJETA: e.target.value }))} />
                            </FormField>
                        </div>
                    )}
                </Modal>
            )}

            {/* Modal de Edición de Botones (Configuración completa) */}
            {configAction && (
                <Modal title={`Configurar Botón: ${configAction.label}`} onClose={() => setConfigAction(null)} footer={
                    <React.Fragment>
                        <button className="btn btn-ghost" style={{ color: 'var(--danger)', marginRight: 'auto' }} onClick={() => removeAction(configAction.id)}>Eliminar</button>
                        <button className="btn btn-ghost" onClick={() => setConfigAction(null)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={() => saveConfigAction(configAction)}>Guardar Cambios</button>
                    </React.Fragment>
                }>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <FormField label="Nombre del Botón">
                            <input className="form-input" value={configAction.label} onChange={e => setConfigAction({...configAction, label: e.target.value})} />
                        </FormField>
                        <FormRow>
                            <FormField label="Precio ($)">
                                <input type="number" className="form-input" value={configAction.price} onChange={e => setConfigAction({...configAction, price: parseFloat(e.target.value) || 0})} />
                            </FormField>
                            <FormField label="Icono (Google Icon Name)">
                                <input className="form-input" value={configAction.icon} onChange={e => setConfigAction({...configAction, icon: e.target.value})} />
                            </FormField>
                        </FormRow>
                        <FormField label="Color del Icono">
                            <input type="color" className="form-input" style={{ height: 40 }} value={configAction.color.startsWith('var') ? '#3b82f6' : configAction.color} onChange={e => setConfigAction({...configAction, color: e.target.value})} />
                        </FormField>
                    </div>
                </Modal>
            )}

            {/* Modal para Nuevo Botón Fijo */}
            {showNewActionModal && (
                <Modal title="Agregar Nuevo Botón de Servicio" onClose={() => setShowNewActionModal(false)} footer={
                    <React.Fragment>
                        <button className="btn btn-ghost" onClick={() => setShowNewActionModal(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={() => {
                            const label = document.getElementById('new-action-label').value;
                            const price = parseFloat(document.getElementById('new-action-price').value) || 0;
                            const icon = document.getElementById('new-action-icon').value || 'build';
                            if (!label) return alert('El nombre es obligatorio');
                            addNewAction({ label, price, icon, color: 'var(--primary)' });
                        }}>Crear Botón</button>
                    </React.Fragment>
                }>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <FormField label="Nombre del Servicio">
                            <input id="new-action-label" className="form-input" placeholder="Ej: Válvula de Aire" />
                        </FormField>
                        <FormRow>
                            <FormField label="Precio sugerido ($)">
                                <input id="new-action-price" type="number" className="form-input" placeholder="0" />
                            </FormField>
                            <FormField label="Icono (ej: air, build, tire_repair)">
                                <input id="new-action-icon" className="form-input" placeholder="build" />
                            </FormField>
                        </FormRow>
                    </div>
                </Modal>
            )}

            {/* Modal de POS Express (Inventario) */}
            {finalizeOT && (
                <Modal title="Finalizar e Ingresar a Caja" onClose={() => setFinalizeOT(null)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
                            Al finalizar este trabajo, se registrará el ingreso correspondiente en caja automáticamente.
                        </p>
                        <FormField label="Método de Pago">
                            <select className="form-select" value={otPaymentMethod} onChange={e => setOtPaymentMethod(e.target.value)}>
                                <option value="EFECTIVO">Efectivo 💵</option>
                                <option value="DEBITO">Débito 💳</option>
                                <option value="CREDITO">Crédito 💳</option>
                                <option value="TRANSFERENCIA">Transferencia 📱</option>
                                <option value="COMBINADO">Combinado 🔀</option>
                            </select>
                        </FormField>

                        {otPaymentMethod === 'COMBINADO' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12, background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)' }}>
                                <FormField label="Efectivo"><input type="number" className="form-input" value={otCombinedAmounts.EFECTIVO} onChange={e => setOtCombinedAmounts({...otCombinedAmounts, EFECTIVO: e.target.value})} /></FormField>
                                <FormField label="Transferencia"><input type="number" className="form-input" value={otCombinedAmounts.TRANSFERENCIA} onChange={e => setOtCombinedAmounts({...otCombinedAmounts, TRANSFERENCIA: e.target.value})} /></FormField>
                                <FormField label="Débito"><input type="number" className="form-input" value={otCombinedAmounts.DEBITO} onChange={e => setOtCombinedAmounts({...otCombinedAmounts, DEBITO: e.target.value})} /></FormField>
                                <FormField label="Crédito"><input type="number" className="form-input" value={otCombinedAmounts.CREDITO} onChange={e => setOtCombinedAmounts({...otCombinedAmounts, CREDITO: e.target.value})} /></FormField>
                            </div>
                        )}

                        <FormRow style={{ justifyContent: 'flex-end', marginTop: 12 }}>
                            <button className="btn btn-ghost" onClick={() => setFinalizeOT(null)}>Cancelar</button>
                            <button className="btn btn-success" onClick={confirmFinalizeOT}>Confirmar Finalización</button>
                        </FormRow>
                    </div>
                </Modal>
            )}

            {showExpressPOS && (
                <Modal title="Agregar Producto de Inventario" onClose={() => setShowExpressPOS(false)} width="500px">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <FormField label="Buscar por nombre, marca o código">
                            <input 
                                className="form-input" 
                                value={posSearch} 
                                onChange={e => setPosSearch(e.target.value)} 
                                placeholder="Ej: Aceite 15w40, Castrol, 779..."
                                autoFocus
                            />
                        </FormField>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                            {posSearch && filteredPOSProducts.map(p => (
                                <div 
                                    key={p.id} 
                                    className="glass-card" 
                                    style={{ padding: 12, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                    onClick={() => addToCartFromPOS(p)}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.brand} | Stock: {p.stock_type === 'UNIT' ? p.stock_quantity : (p.stock_ml/1000).toFixed(1)+'L'}</div>
                                    </div>
                                    <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(p.sell_price)}</div>
                                </div>
                            ))}
                            {posSearch && filteredPOSProducts.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No se encontraron productos maching</div>
                            )}
                            {!posSearch && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Escribe algo para buscar...</div>}
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal de Ticket Generado */}
            {showTicketModal && lastTicket && (
                <Modal title="Servicio Registrado" onClose={() => setShowTicketModal(false)} footer={
                    <React.Fragment>
                        <button className="btn btn-ghost" onClick={() => setShowTicketModal(false)}>Cerrar</button>
                        <button className="btn btn-success" onClick={printTicket} title="Imprimir el ticket para el cliente">
                            <Icon name="print" size={18} /> Imprimir Ticket
                        </button>
                    </React.Fragment>
                }>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Icon name="check_circle" size={56} style={{ color: 'var(--success)', marginBottom: 16 }} />
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 20 }}>¡Servicio registrado con éxito!</h3>
                        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '16px 0' }}>
                            {lastTicket.label}
                        </div>
                        <div style={{ fontSize: 18, color: 'var(--primary)', fontWeight: 700 }}>
                            {lastTicket.price > 0 ? `$${lastTicket.price.toLocaleString('es-AR')}` : 'GRATIS'}
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>
                            Podés entregarle el ticket impreso al cliente para que lo abone en caja.
                        </p>
                    </div>
                </Modal>
            )}

            {/* Modal de Servicio Libre */}
            {showCustomModal && (
                <Modal title="Agregar Servicio Libre" onClose={() => setShowCustomModal(false)} footer={
                    <React.Fragment>
                        <button className="btn btn-ghost" onClick={() => setShowCustomModal(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleCustomSubmit} title="Confirmar y cobrar el servicio libre">Confirmar y Cobrar</button>
                    </React.Fragment>
                }>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <FormField label="¿Qué servicio realizaste? *">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: Soldadura de escape"
                                value={customService.label}
                                onChange={(e) => setCustomService(prev => ({ ...prev, label: e.target.value }))}
                                autoFocus
                            />
                        </FormField>
                        <FormField label="Precio Acordado ($) *" icon="attach_money">
                            <input
                                type="number"
                                className="form-input"
                                placeholder="Ej: 8500"
                                value={customService.price}
                                onChange={(e) => setCustomService(prev => ({ ...prev, price: e.target.value }))}
                            />
                        </FormField>
                    </div>
                </Modal>
            )}
        </div>
    );
};
