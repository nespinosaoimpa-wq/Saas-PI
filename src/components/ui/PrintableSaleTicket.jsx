import React from 'react';
import { formatCurrency } from '../../data/data';

export const PrintableSaleTicket = ({ sale, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="ticket-overlay">
            <div className="ticket-container">
                <div className="ticket-actions no-print">
                    <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
                    <button className="btn btn-primary" onClick={handlePrint}>🖨️ Imprimir / Guardar PDF</button>
                </div>

                <div className="ticket-paper">
                    <div className="ticket-header">
                        <h2>PIRIPI SANTA FE</h2>
                        <p>Lubricentro y Gomería</p>
                        <p>Santa Fe, Argentina</p>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-info">
                        {sale.afip ? (
                            <>
                                <div><strong>Factura Electrónica N°:</strong> {sale.afip.receiptText}</div>
                                <div><strong>Fecha:</strong> {new Date().toLocaleString('es-AR')}</div>
                                <div><strong>Cond. Venta:</strong> {sale.method}</div>
                            </>
                        ) : (
                            <>
                                <div><strong>Comprobante Interno N°:</strong> POS-{Date.now().toString().slice(-6)}</div>
                                <div style={{ fontSize: 10, color: '#666' }}>Documento no válido como factura</div>
                                <div><strong>Fecha:</strong> {new Date().toLocaleString('es-AR')}</div>
                                <div><strong>Método:</strong> {sale.method}</div>
                            </>
                        )}
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-details">
                        <table>
                            <thead>
                                <tr>
                                    <th>CANT</th>
                                    <th>DESCRIPCIÓN</th>
                                    <th style={{ textAlign: 'right' }}>SUBT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.items.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                                        <td style={{ textAlign: 'center' }}>{item.qty}</td>
                                        <td>{item.name}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.qty * item.sell_price)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-total">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold' }}>
                            <span>TOTAL:</span>
                            <span>{formatCurrency(sale.total)}</span>
                        </div>
                    </div>

                    <div className="ticket-footer" style={{ marginTop: 20 }}>
                        {sale.afip ? (
                            <div style={{ padding: 10, border: '1px solid #000', borderRadius: 4, marginBottom: 12 }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://www.afip.gob.ar/fe/qr/')}`}
                                    alt="AFIP QR"
                                    style={{ width: 100, height: 100, marginBottom: 8 }}
                                />
                                <div style={{ fontSize: 13, fontWeight: 'bold' }}>
                                    CAE: {sale.afip.cae}
                                </div>
                                <div style={{ fontSize: 11 }}>
                                    Vto. CAE: {sale.afip.caeDueDate?.replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1')}
                                </div>
                            </div>
                        ) : null}

                        <p style={{ fontWeight: 'bold' }}>¡Gracias por su compra!</p>
                        <p style={{ fontSize: 10, marginTop: 4 }}>Los cambios se aceptan dentro de los 15 días con este comprobante conservando el empaque original.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
