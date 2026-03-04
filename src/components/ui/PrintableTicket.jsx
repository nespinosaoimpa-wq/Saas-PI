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
                        <div><strong>Cliente:</strong> {workOrder.client || 'Consumidor Final'}</div>
                        <div><strong>Vehículo:</strong> {workOrder.vehicle || '—'}</div>
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
                                <tr>
                                    <td>1</td>
                                    <td>Servicio: {workOrder.description || 'Mantenimiento General'}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(workOrder.labor_cost || 0)}</td>
                                </tr>
                                {(workOrder.parts_cost > 0) && (
                                    <tr>
                                        <td>1</td>
                                        <td>Repuestos / Materiales</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(workOrder.parts_cost || 0)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-total">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold' }}>
                            <span>TOTAL:</span>
                            <span>{formatCurrency(workOrder.total_price || 0)}</span>
                        </div>
                    </div>

                    <div className="ticket-footer">
                        <p>¡Gracias por confiar en nosotros!</p>
                        <p style={{ fontSize: 10 }}>Documento no válido como factura. Los cambios se aceptan dentro de los 15 días con este comprobante.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
