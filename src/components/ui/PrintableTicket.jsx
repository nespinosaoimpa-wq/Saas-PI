import React, { useEffect } from 'react';
import { formatCurrency } from '../../data/data';

// Componente diseñado para imprimirse en tickeadora térmica o exportar a PDF (A4)
export const PrintableTicket = ({ workOrder, onClose }) => {

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

                {/* Área imprimible */}
                <div className="ticket-paper">
                    <div className="ticket-header">
                        <h2>PIRIPI PRO</h2>
                        <p>Lubricentro y Gomería</p>
                        <p>CUIT: 30-12345678-9</p>
                        <p>Av. Siempre Viva 123, Mar del Plata</p>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-info">
                        <div><strong>Ticket N°:</strong> {workOrder.order_number}</div>
                        <div><strong>Fecha:</strong> {new Date().toLocaleDateString()}</div>
                        <div><strong>Cliente:</strong> {workOrder._clientName || 'Consumidor Final'}</div>
                        <div><strong>Vehículo:</strong> {workOrder._vehicleInfo || '—'}</div>
                        <div><strong>Mecánico:</strong> {workOrder.mechanic || '—'}</div>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-details">
                        <table>
                            <thead>
                                <tr>
                                    <th>CANT</th>
                                    <th>DESCRIPCIÓN</th>
                                    <th style={{ textAlign: 'right' }}>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Aquí idealmente iteraríamos sobre los insumos de la OT */}
                                <tr>
                                    <td>1</td>
                                    <td>Filtro de Aceite</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(8500)}</td>
                                </tr>
                                <tr>
                                    <td>1</td>
                                    <td>Aceite Sintético 4L</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(45000)}</td>
                                </tr>
                                <tr>
                                    <td>1</td>
                                    <td>Mano de Obra</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(12000)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-total">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold' }}>
                            <span>TOTAL:</span>
                            <span>{formatCurrency(workOrder.total_price || 65500)}</span>
                        </div>
                    </div>

                    <div className="ticket-footer">
                        <p>¡Gracias por confiar en nosotros!</p>
                        <p style={{ fontSize: 10 }}>Los cambios se aceptan dentro de los 15 días con este comprobante.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
