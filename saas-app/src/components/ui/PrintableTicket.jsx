import React from 'react';
import { formatCurrency } from '../../data/data';

// Componente diseñado para imprimirse en tickeadora térmica o exportar a PDF (A4)
export const PrintableTicket = ({ workOrder, onClose }) => {

    const handlePrint = () => {
        window.print();
    };

    // Extraer datos de relaciones de Supabase si existen
    const clientName = workOrder.clients
        ? `${workOrder.clients.first_name} ${workOrder.clients.last_name}`
        : (workOrder._clientName || 'Consumidor Final');
    const vehicleInfo = workOrder.vehicles
        ? `${workOrder.vehicles.brand} ${workOrder.vehicles.model} (${workOrder.vehicles.license_plate})`
        : (workOrder._vehicleInfo || '—');
    const laborCost = parseFloat(workOrder.labor_cost) || 0;
    const partsCost = parseFloat(workOrder.parts_cost) || 0;
    const totalPrice = parseFloat(workOrder.total_price) || (laborCost + partsCost);

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
                        <div><strong>Fecha:</strong> {workOrder.completed_at ? new Date(workOrder.completed_at).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                        <div><strong>Cliente:</strong> {clientName}</div>
                        <div><strong>Vehículo:</strong> {vehicleInfo}</div>
                        <div><strong>Km:</strong> {workOrder.km_at_entry ? `${workOrder.km_at_entry} km` : '—'}</div>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-details">
                        <table>
                            <thead>
                                <tr>
                                    <th>DESCRIPCIÓN</th>
                                    <th style={{ textAlign: 'right' }}>IMPORTE</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{workOrder.description || 'Servicio realizado'}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(totalPrice)}</td>
                                </tr>
                                {laborCost > 0 && (
                                    <tr style={{ fontSize: '0.85em', color: '#666' }}>
                                        <td style={{ paddingLeft: 16 }}>— Mano de Obra</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(laborCost)}</td>
                                    </tr>
                                )}
                                {partsCost > 0 && (
                                    <tr style={{ fontSize: '0.85em', color: '#666' }}>
                                        <td style={{ paddingLeft: 16 }}>— Repuestos / Materiales</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(partsCost)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-total">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 'bold' }}>
                            <span>TOTAL:</span>
                            <span>{formatCurrency(totalPrice)}</span>
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
