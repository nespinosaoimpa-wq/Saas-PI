import React, { useState } from 'react';
import { formatCurrency, MOCK as STATIC_MOCK } from '../data/data';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { SectionHeader, GlassCard, StatusBadge, CheckItem, Icon, Modal, FormField } from '../components/ui';

export const DailyWorkPage = () => {
    const { data: MOCK, getClient, getVehicle, updateWorkOrder, addQuickService, getCommissions, refreshData, deleteWorkOrder } = useApp();
    const { user } = useAuth();

    const myOrders = MOCK.workOrders.filter(wo => wo.status === 'En Box' && wo.mechanic_id === user?.id);
    // Persist queue using workOrders with status 'Pendiente'
    const gomeriaQueue = MOCK.workOrders.filter(wo => wo.status === 'Pendiente');

    const commissions = user ? getCommissions(user.id) : 0;

    const [editingAction, setEditingAction] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [lastTicket, setLastTicket] = useState(null);
    const [selectedQueueClient, setSelectedQueueClient] = useState(null);
    const [newQueueName, setNewQueueName] = useState('');

    const handleFinishOrder = (id) => {
        if (window.confirm('¿Confirmar finalización del trabajo?')) {
            updateWorkOrder(id, { status: 'Finalizado', completed_at: new Date().toISOString() });
        }
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

    const handleQuickAction = async (action) => {
        let reference = selectedQueueClient ? (selectedQueueClient.notes || selectedQueueClient.description) : '';

        if (!selectedQueueClient) {
            const name = window.prompt("Ingresá un nombre o referencia para este servicio:", "Cliente Gomería");
            if (!name) return;
            reference = name;
        }

        const newWo = await addQuickService(action, reference);

        if (newWo) {
            setLastTicket({
                id: `T-${newWo.id.slice(0, 6).toUpperCase()}`,
                label: action.label,
                price: action.price,
                timestamp: new Date().toLocaleString('es-AR')
            });
            setShowTicketModal(true);
        }
    };

    const addToQueue = async () => {
        if (!newQueueName.trim()) return;
        try {
            // Acceso directo a supabase para simplificar este flujo rápido
            const { supabase } = await import('../lib/supabase');
            await supabase.from('work_orders').insert([{
                description: 'En espera: ' + newQueueName,
                status: 'Pendiente',
                notes: newQueueName
            }]);
            refreshData();
            setNewQueueName('');
        } catch (e) {
            console.error(e);
        }
    };

    const removeFromQueue = async (id) => {
        if (window.confirm('¿Quitar de la cola?')) {
            await deleteWorkOrder(id);
            if (selectedQueueClient?.id === id) setSelectedQueueClient(null);
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
                                            <CheckItem key={item.key} label={item.label} sub={item.group} />
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: 10 }}>
                                        <button className="btn btn-success" style={{ flex: 1, height: 46, fontSize: 14, fontWeight: 700 }} onClick={() => handleFinishOrder(wo.id)}>
                                            <Icon name="check_circle" size={20} /> FINALIZAR TRABAJO
                                        </button>
                                        <button className="btn btn-ghost" style={{ width: 46, height: 46, padding: 0, justifyContent: 'center' }}>
                                            <Icon name="photo_camera" size={20} />
                                        </button>
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
                                    <span>{q.notes || q.description}</span>
                                    <button onClick={(e) => { e.stopPropagation(); removeFromQueue(q.id); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', padding: 0, fontSize: 18, marginLeft: 4 }}>&times;</button>
                                </div>
                            ))}
                            {gomeriaQueue.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No hay clientes en espera</div>}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: 20 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                            {selectedQueueClient ? (
                                <span>Registrando servicios para: <strong>{selectedQueueClient.name}</strong>. A partir del 2do parche de igual tipo, descuento del 30%.</span>
                            ) : (
                                <span>Seleccioná un cliente de la cola para aplicar lógica de parches adicionales.</span>
                            )}
                        </p>

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
                                    {/* Icono de edición (absoluto) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditPrice(action); }}
                                        style={{
                                            position: 'absolute', top: 6, right: 6,
                                            background: 'var(--bg-base)', border: 'none',
                                            borderRadius: '50%', width: 24, height: 24,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', color: 'var(--text-muted)'
                                        }}
                                    >
                                        <Icon name="edit" size={14} />
                                    </button>

                                    <Icon name={action.icon} size={28} style={{ color: action.color, marginBottom: 8 }} />
                                    <div className="quick-action-label">{action.label}</div>
                                    <div style={{ fontSize: 11, color: action.price > 0 ? 'var(--text-primary)' : 'var(--success)', fontWeight: 700, marginTop: 4 }}>
                                        {action.price > 0 ? formatCurrency(action.price) : 'GRATIS'}
                                    </div>
                                </div>
                            ))}
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
                            <button className="btn btn-sm btn-ghost">Detalle</button>
                        </div>
                        <div className="stat-bar" style={{ height: 5, marginTop: 14 }}>
                            <div className="stat-bar-fill" style={{ width: '65%' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Edición de Precios Rápidos */}
            {editingAction && (
                <Modal title={`Editar Precio: ${editingAction.label}`} onClose={() => setEditingAction(null)} footer={
                    <React.Fragment>
                        <button className="btn btn-ghost" onClick={() => setEditingAction(null)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={saveEditPrice}>Guardar Precio</button>
                    </React.Fragment>
                }>
                    <FormField label="Nuevo Precio Fijo ($)" icon="attach_money">
                        <input
                            type="number"
                            className="form-input"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            min={0}
                            step={100}
                            autoFocus
                        />
                    </FormField>
                    <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                        <Icon name="info" size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        Al guardar, el precio fijado será aplicable solo en este navegador (se guarda en caché local). Si pones 0, el servicio figurará como GRATIS.
                    </p>
                </Modal>
            )}

            {/* Modal de Ticket Generado */}
            {showTicketModal && lastTicket && (
                <Modal title="Servicio Registrado" onClose={() => setShowTicketModal(false)} footer={
                    <React.Fragment>
                        <button className="btn btn-ghost" onClick={() => setShowTicketModal(false)}>Cerrar</button>
                        <button className="btn btn-success" onClick={printTicket}>
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
        </div>
    );
};
