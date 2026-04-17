import React, { useState, useMemo, Fragment } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../data/data';
import {
    SectionHeader,
    Modal,
    FormField,
    Icon,
    EmptyState,
    StatusBadge
} from '../components/ui';

export const HouseCreditPage = () => {
    const { data: MOCK, recordCreditPayment } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCredit, setSelectedCredit] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('EFECTIVO');
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ACTIVO'); // ACTIVO, PAGADO, TODOS

    const groupedCredits = useMemo(() => {
        let list = MOCK.clientCredits || [];
        
        // 1. Filtrado inicial (Search y Status)
        if (filterStatus !== 'TODOS') {
            list = list.filter(c => c.status === filterStatus);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(c => {
                const client = MOCK.clients.find(cl => cl.id === c.client_id);
                return (
                    (client && `${client.first_name} ${client.last_name} ${client.dni}`.toLowerCase().includes(term)) ||
                    (c.notes && c.notes.toLowerCase().includes(term))
                );
            });
        }

        // 2. Agrupamiento por Cliente
        const groups = {};
        list.forEach(c => {
            if (!groups[c.client_id]) {
                const client = MOCK.clients.find(cl => cl.id === c.client_id);
                groups[c.client_id] = {
                    id: `group-${c.client_id}`,
                    client_id: c.client_id,
                    client_dni: client?.dni || 'N/A',
                    total_amount: 0,
                    current_balance: 0,
                    credits_count: 0,
                    status: 'PAGADO',
                    next_payment_date: null,
                    payment_frequency: 'VARIABLE',
                    credits_list: [] // Nueva lista de detalles
                };
            }
            const g = groups[c.client_id];
            g.total_amount += parseFloat(c.total_amount);
            g.current_balance += parseFloat(c.current_balance);
            g.credits_count += 1;
            if (c.status === 'ACTIVO') g.status = 'ACTIVO';
            
            // Buscar info de la OT
            const ot = MOCK.workOrders.find(wo => wo.id === c.work_order_id);
            g.credits_list.push({
                id: c.id,
                amount: parseFloat(c.total_amount),
                balance: parseFloat(c.current_balance),
                date: c.created_at || ot?.created_at,
                ot_number: ot?.order_number,
                description: ot?.description || c.notes || 'Venta s/ OT'
            });

            // Frecuencia y fecha
            if (c.payment_frequency !== 'VARIABLE') g.payment_frequency = c.payment_frequency;
            if (c.next_payment_date && (!g.next_payment_date || new Date(c.next_payment_date) < new Date(g.next_payment_date))) {
                g.next_payment_date = c.next_payment_date;
            }
        });

        return Object.values(groups).sort((a, b) => b.current_balance - a.current_balance);
    }, [MOCK.clientCredits, MOCK.clients, MOCK.workOrders, searchTerm, filterStatus]);

    const stats = useMemo(() => {
        const active = (MOCK.clientCredits || []).filter(c => c.status === 'ACTIVO');
        return {
            totalDebt: active.reduce((sum, c) => sum + parseFloat(c.current_balance), 0),
            count: active.length
        };
    }, [MOCK.clientCredits]);

    const handleRecordPayment = async () => {
        if (!selectedCredit || !paymentAmount || parseFloat(paymentAmount) <= 0) {
            return alert('Monto inválido');
        }

        setIsProcessing(true);
        try {
            // Usamos la nueva lógica de AppContext para pagar a nivel de CLIENTE
            await recordCreditPayment(selectedCredit.client_id, {
                amount: parseFloat(paymentAmount),
                method: paymentMethod,
                description: `Pago a cuenta unificado - ${getClientName(selectedCredit.client_id)}`
            }, true); // isClient = true
            
            alert('Pago registrado correctamente cargado a la cuenta corriente.');
            setSelectedCredit(null);
            setPaymentAmount('');
        } catch (e) {
            alert('Error al registrar pago: ' + e.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const getClientName = (clientId) => {
        const client = MOCK.clients.find(c => c.id === clientId);
        return client ? `${client.first_name} ${client.last_name}` : 'Cliente Desconocido';
    };

    return (
        <div className="page-content animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <SectionHeader icon="account_balance_wallet" title="Crédito de la Casa / Cuentas Corrientes" />
                
                <div style={{ display: 'flex', gap: 12 }}>
                    <div className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: 8, borderRadius: 8 }}>
                            <Icon name="trending_up" size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>DEUDA TOTAL</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(stats.totalDebt)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 250, position: 'relative' }}>
                        <Icon name="search" size={20} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                        <input
                            className="form-input"
                            placeholder="Buscar por cliente o notas..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: 40, width: '100%' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                            className={`btn ${filterStatus === 'ACTIVO' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setFilterStatus('ACTIVO')}
                        >Activos</button>
                        <button 
                            className={`btn ${filterStatus === 'PAGADO' ? 'btn-success' : 'btn-ghost'}`}
                            onClick={() => setFilterStatus('PAGADO')}
                        >Pagados</button>
                        <button 
                            className={`btn ${filterStatus === 'TODOS' ? 'btn-secondary' : 'btn-ghost'}`}
                            onClick={() => setFilterStatus('TODOS')}
                        >Todos</button>
                    </div>
                </div>
            </div>

            {groupedCredits.length === 0 ? (
                <EmptyState 
                    icon="credit_card_off" 
                    title="No hay créditos que coincidan" 
                    sub="Las cuentas corrientes aparecerán aquí cuando vendas productos o servicios con este método de pago." 
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                    {groupedCredits.map(group => {
                        const progress = ((parseFloat(group.total_amount) - parseFloat(group.current_balance)) / parseFloat(group.total_amount)) * 100;
                        
                        return (
                            <div key={group.id} className="glass-card hover-scale" style={{ padding: '24px 20px', position: 'relative', overflow: 'hidden', borderLeft: `6px solid ${group.status === 'PAGADO' ? 'var(--success)' : 'var(--danger)'}`, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.2 }}>{getClientName(group.client_id)}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Icon name="fingerprint" size={14} /> DNI: {group.client_dni}
                                        </div>
                                    </div>
                                    <StatusBadge status={group.status} type={group.status === 'PAGADO' ? 'success' : 'danger'}>
                                        {group.status}
                                    </StatusBadge>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Progreso de Pago Total</span>
                                        <span style={{ color: group.status === 'PAGADO' ? 'var(--success)' : 'var(--primary)' }}>{Math.round(progress)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: 6, background: 'var(--bg-hover)', borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{ width: `${progress}%`, height: '100%', background: group.status === 'PAGADO' ? 'var(--success)' : 'var(--primary)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ padding: '12px 10px', background: 'var(--bg-hover)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>HISTORIAL</div>
                                        <div style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(group.total_amount)}</div>
                                    </div>
                                    <div style={{ padding: '12px 10px', background: group.status === 'PAGADO' ? 'var(--success-light)' : 'var(--danger-light)', borderRadius: 12, border: '1px solid currentColor' }}>
                                        <div style={{ fontSize: 9, color: 'inherit', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2, opacity: 0.8 }}>PENDIENTE</div>
                                        <div style={{ fontSize: 16, fontWeight: 900 }}>{formatCurrency(group.current_balance)}</div>
                                    </div>
                                </div>

                                {/* Desglose de OTs */}
                                <div style={{ marginTop: 4 }}>
                                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Icon name="list_alt" size={14} /> Desglose de Órdenes / Ventas ({group.credits_count})
                                    </div>
                                    <div className="custom-scroll" style={{ background: 'rgba(0,0,0,0.1)', borderRadius: 12, padding: 6, maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid var(--border)' }}>
                                        {group.credits_list.map(item => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 8, fontSize: 11, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {item.ot_number ? `OT #${item.ot_number}` : 'Venta s/ OT'}
                                                    </span>
                                                    <span style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {item.date ? new Date(item.date).toLocaleDateString() : '-'} • {item.description}
                                                    </span>
                                                </div>
                                                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 8 }}>
                                                    <div style={{ fontWeight: 800, color: item.balance > 0 ? 'var(--danger)' : 'var(--success)', fontSize: 12 }}>{formatCurrency(item.balance)}</div>
                                                    {item.balance < item.amount && <div style={{ fontSize: 8, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatCurrency(item.amount)}</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                                            <Icon name="event" size={14} />
                                        </div>
                                        <span>Frecuencia: <strong>{group.payment_frequency}</strong></span>
                                    </div>
                                    {group.next_payment_date && group.status !== 'PAGADO' && (
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                <Icon name="schedule" size={14} />
                                            </div>
                                            <span>Próximo vencimiento: <strong style={{color: 'var(--text-primary)'}}>{new Date(group.next_payment_date).toLocaleDateString()}</strong></span>
                                        </div>
                                    )}
                                </div>

                                {group.status !== 'PAGADO' && (
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 14, boxShadow: 'var(--shadow-lg)' }}
                                        onClick={() => {
                                            setSelectedCredit(group);
                                            setPaymentAmount('');
                                        }}
                                    >
                                        <Icon name="payments" size={20} /> Imputar Pago Unificado
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedCredit && (
                <Modal 
                    title={`Registrar Pago Unificado - ${getClientName(selectedCredit.client_id)}`}
                    onClose={() => setSelectedCredit(null)}
                    footer={
                        <Fragment>
                            <button className="btn btn-ghost" onClick={() => setSelectedCredit(null)}>Cancelar</button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleRecordPayment}
                                disabled={isProcessing || !paymentAmount}
                            >
                                {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
                            </button>
                        </Fragment>
                    }
                >
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ padding: 12, background: 'var(--bg-hover)', borderRadius: 12, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Deuda Total Acumulada:</span>
                            <span style={{ fontWeight: 800, color: 'var(--danger)' }}>{formatCurrency(selectedCredit.current_balance)}</span>
                        </div>

                        <FormField label="Monto a Pagar">
                            <input 
                                type="number" 
                                className="form-input" 
                                value={paymentAmount}
                                onChange={e => setPaymentAmount(e.target.value)}
                                placeholder="0.00"
                                autoFocus
                            />
                        </FormField>

                        <FormField label="Método de Pago">
                            <select 
                                className="form-select" 
                                value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}
                            >
                                <option value="EFECTIVO">Efectivo 💵</option>
                                <option value="DEBITO">Débito 💳</option>
                                <option value="TRANSFERENCIA">Transferencia 📲</option>
                                <option value="TARJETA">Tarjeta de Crédito 💳</option>
                            </select>
                        </FormField>

                        {paymentAmount && parseFloat(paymentAmount) > 0 && (
                            <div style={{ padding: 12, background: 'var(--success-light)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', border: '1px solid var(--success)' }}>
                                <span style={{ color: 'var(--success-dark)', fontWeight: 600 }}>Cierra en:</span>
                                <span style={{ fontWeight: 800, color: 'var(--success-dark)' }}>
                                    {formatCurrency(Math.max(0, selectedCredit.current_balance - parseFloat(paymentAmount)))}
                                </span>
                            </div>
                        )}
                        
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 8 }}>
                            * El pago se distribuirá automáticamente entre los {selectedCredit.credits_count} créditos activos del cliente.
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
