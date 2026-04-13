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

    const credits = useMemo(() => {
        let list = MOCK.clientCredits || [];
        
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

        return list;
    }, [MOCK.clientCredits, MOCK.clients, searchTerm, filterStatus]);

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
            await recordCreditPayment(selectedCredit.id, {
                amount: parseFloat(paymentAmount),
                method: paymentMethod,
                description: `Pago a cuenta - Crédito #${selectedCredit.id.substring(0,8)}`
            });
            alert('Pago registrado correctamente');
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
        <div className="page-container animate-fade-in">
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

            {credits.length === 0 ? (
                <EmptyState 
                    icon="credit_card_off" 
                    title="No hay créditos que coincidan" 
                    sub="Las cuentas corrientes aparecerán aquí cuando vendas productos o servicios con este método de pago." 
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
                    {credits.map(credit => {
                        const client = MOCK.clients.find(c => c.id === credit.client_id);
                        const progress = ((parseFloat(credit.total_amount) - parseFloat(credit.current_balance)) / parseFloat(credit.total_amount)) * 100;
                        
                        return (
                            <div key={credit.id} className="glass-card hover-scale" style={{ padding: 20, position: 'relative', borderLeft: `6px solid ${credit.status === 'PAGADO' ? 'var(--success)' : 'var(--danger)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 800 }}>{getClientName(credit.client_id)}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>DNI: {client?.dni || 'N/A'}</div>
                                    </div>
                                    <StatusBadge status={credit.status} type={credit.status === 'PAGADO' ? 'success' : 'danger'}>
                                        {credit.status}
                                    </StatusBadge>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                        <span>Progreso de Pago</span>
                                        <span fontWeight="700">{Math.round(progress)}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: 8, background: 'var(--bg-hover)', borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{ width: `${progress}%`, height: '100%', background: credit.status === 'PAGADO' ? 'var(--success)' : 'var(--primary)', transition: 'width 0.5s ease-out' }}></div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                    <div style={{ padding: 10, background: 'var(--bg-hover)', borderRadius: 8 }}>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL ORIGINAL</div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{formatCurrency(credit.total_amount)}</div>
                                    </div>
                                    <div style={{ padding: 10, background: credit.status === 'PAGADO' ? 'var(--success-light)' : 'var(--danger-light)', borderRadius: 8 }}>
                                        <div style={{ fontSize: 10, color: credit.status === 'PAGADO' ? 'var(--success-dark)' : 'var(--danger-dark)', fontWeight: 700 }}>SALDO PENDIENTE</div>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: credit.status === 'PAGADO' ? 'var(--success-dark)' : 'var(--danger-dark)' }}>{formatCurrency(credit.current_balance)}</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        <Icon name="event" size={14} /> Frecuencia: <strong>{credit.payment_frequency}</strong>
                                    </div>
                                    {credit.next_payment_date && (
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <Icon name="schedule" size={14} /> Próximo vencimiento: <strong style={{color: 'var(--primary)'}}>{new Date(credit.next_payment_date).toLocaleDateString()}</strong>
                                        </div>
                                    )}
                                </div>

                                {credit.status !== 'PAGADO' && (
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ width: '100%' }}
                                        onClick={() => {
                                            setSelectedCredit(credit);
                                            setPaymentAmount('');
                                        }}
                                    >
                                        <Icon name="add_card" size={20} /> Imputar Pago
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedCredit && (
                <Modal 
                    title={`Registrar Pago - ${getClientName(selectedCredit.client_id)}`}
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
                            <span style={{ color: 'var(--text-muted)' }}>Saldo actual:</span>
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
                                <span style={{ color: 'var(--success-dark)', fontWeight: 600 }}>Nuevo Saldo:</span>
                                <span style={{ fontWeight: 800, color: 'var(--success-dark)' }}>
                                    {formatCurrency(Math.max(0, selectedCredit.current_balance - parseFloat(paymentAmount)))}
                                </span>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};
