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
                        <h2>PIRIPI SANTA FE</h2>
                        <p>Lubricentro y Gomería</p>
                        <p>Santa Fe, Argentina</p>
                    </div>

                    <div className="ticket-divider" />

                    <div className="ticket-info">
                        {workOrder.afip ? (
                            <>
                                <div><strong>Factura Electrónica N°:</strong> {workOrder.afip.receiptText}</div>
                                <div><strong>Fecha:</strong> {workOrder.completed_at ? new Date(workOrder.completed_at).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                                <div><strong>Cliente:</strong> {clientName}</div>
                                <div><strong>Vehículo:</strong> {vehicleInfo}</div>
                                <div><strong>Km:</strong> {workOrder.km_at_entry ? `${workOrder.km_at_entry} km` : '—'}</div>
                            </>
                        ) : (
                            <>
                                <div><strong>Ticket Interno N°:</strong> {workOrder.order_number}</div>
                                <div style={{ fontSize: 10, color: '#666' }}>Documento no válido como factura</div>
                                <div><strong>Fecha:</strong> {workOrder.completed_at ? new Date(workOrder.completed_at).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                                <div><strong>Cliente:</strong> {clientName}</div>
                                <div><strong>Vehículo:</strong> {vehicleInfo}</div>
                                <div><strong>Km:</strong> {workOrder.km_at_entry ? `${workOrder.km_at_entry} km` : '—'}</div>
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
                                    <th style={{ textAlign: 'right' }}>IMPORTE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Si hay items detallados, los mostramos */}
                                {workOrder.items && workOrder.items.length > 0 ? (
                                    workOrder.items.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px dashed #eee' }}>
                                            <td style={{ textAlign: 'center' }}>{item.quantity || 1}</td>
                                            <td>{item.description || item.name}</td>
                                            <td style={{ textAlign: 'right' }}>{formatCurrency(item.total_price || (item.unit_price * item.quantity) || 0)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td>1</td>
                                        <td>{workOrder.description || 'Servicio realizado'}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(totalPrice)}</td>
                                    </tr>
                                )}

                                {/* Mostrar Mano de Obra por separado si existe y no está en items (retrocompatibilidad) */}
                                {laborCost > 0 && (!workOrder.items || workOrder.items.length === 0) && (
                                    <tr style={{ fontSize: '0.85em', color: '#666' }}>
                                        <td></td>
                                        <td style={{ paddingLeft: 16 }}>— Mano de Obra</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(laborCost)}</td>
                                    </tr>
                                )}
                                {partsCost > 0 && (!workOrder.items || workOrder.items.length === 0) && (
                                    <tr style={{ fontSize: '0.85em', color: '#666' }}>
                                        <td></td>
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

                    <div className="ticket-footer" style={{ marginTop: 20 }}>
                        {workOrder.afip ? (
                            <div style={{ padding: 10, border: '1px solid #000', borderRadius: 4, marginBottom: 12 }}>
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('https://www.afip.gob.ar/fe/qr/')}`}
                                    alt="AFIP QR"
                                    style={{ width: 100, height: 100, marginBottom: 8 }}
                                />
                                <div style={{ fontSize: 13, fontWeight: 'bold' }}>
                                    CAE: {workOrder.afip.cae}
                                </div>
                                <div style={{ fontSize: 11 }}>
                                    Vto. CAE: {workOrder.afip.caeDueDate?.replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1')}
                                </div>
                            </div>
                        ) : null}

                        <p style={{ fontWeight: 'bold' }}>¡Gracias por confiar en nosotros!</p>
                        <p style={{ fontSize: 10, marginTop: 4 }}>Los cambios se aceptan dentro de los 15 días con este comprobante.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
