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
                        <h2>PIRIPI PRO</h2>
                        <p>Lubricentro y Gomería</p>
                        <p>CUIT: 30-12345678-9</p>
                        <p>Av. Siempre Viva 123, Mar del Plata</p>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-info">
                        <div><strong>Ticket Venta N°:</strong> POS-{Date.now().toString().slice(-6)}</div>
                        <div><strong>Fecha:</strong> {new Date().toLocaleString('es-AR')}</div>
                        <div><strong>Método:</strong> {sale.method}</div>
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

                    <div className="ticket-footer">
                        <p>¡Gracias por su compra!</p>
                        <p style={{ fontSize: 10 }}>Los cambios se aceptan dentro de los 15 días con este comprobante conservando el empaque original.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
