import React from 'react';
import { Icon } from './Icon';
import { formatCurrency } from '../../data/data';

export const PrintableClosing = ({ closing, onClose }) => {
    if (!closing) return null;

    const printPage = () => {
        window.print();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'white', zIndex: 9999, padding: '40px 20px',
            overflowY: 'auto', color: 'black', fontFamily: 'monospace'
        }} className="printable-area">
            <div style={{ maxWidth: '400px', margin: '0 auto', border: '1px solid #eee', padding: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h2 style={{ margin: 0 }}>PIRIPI SANTA FE</h2>
                    <p style={{ margin: '4px 0', fontSize: 14 }}>RESUMEN DE CIERRE DE CAJA</p>
                    <div style={{ height: 1, background: '#000', margin: '10px 0' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Fecha:</span>
                    <strong>{closing.date}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>Cajero:</span>
                    <strong>{closing.employee_name || 'Admin'}</strong>
                </div>

                <div style={{ height: 1, borderTop: '1px dashed #000', margin: '15px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Efectivo Esperado:</span>
                    <span>{formatCurrency(closing.expected_cash || closing.cash_income)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Transferencia:</span>
                    <span>{formatCurrency(closing.transfer_income)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Tarjeta:</span>
                    <span>{formatCurrency(closing.card_income)}</span>
                </div>

                <div style={{ height: 1, borderTop: '1px dashed #000', margin: '15px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 18 }}>
                    <strong>Efectivo Real:</strong>
                    <strong>{formatCurrency(closing.actual_cash)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: closing.difference < 0 ? 'red' : 'green' }}>
                    <span>Diferencia:</span>
                    <span>{formatCurrency(closing.difference)}</span>
                </div>

                <div style={{ marginTop: 40, borderTop: '1px solid #000', paddingTop: 10, textAlign: 'center', fontSize: 12 }}>
                    Firma Responsable
                </div>

                <div className="no-print" style={{ marginTop: 30, display: 'flex', gap: 10 }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '10px', cursor: 'pointer' }}>Cerrar</button>
                    <button onClick={printPage} style={{ flex: 1, padding: '10px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}>Imprimir</button>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .printable-area { position: relative !important; padding: 0 !important; }
                }
            `}</style>
        </div>
    );
};
