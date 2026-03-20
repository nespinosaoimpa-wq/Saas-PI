import React from 'react';
import { Icon } from '../components/ui';

export const HelpPage = () => {
    const sections = [
        {
            title: 'Dashboard (Panel de Control Principal)',
            content: 'Este es el "centro de comando" de tu negocio. Aquí ves lo que está pasando AHORA.',
            image: '/assets/manual/dash.png',
            bullets: [
                'Caja del Día: Muestra el dinero total cobrado hoy. Clic para ver el desglose.',
                'OTs Activas: Indica cuántos vehículos están actualmente en el taller.',
                'Stock Crítico: Lista los productos que están por debajo del mínimo.',
                'Botón "Nueva OT": Atajo rápido para abrir el modal de creación de órdenes.',
                'Cámara/Lector: Acceso rápido para escanear productos con el celular o lector láser.'
            ]
        },
        {
            title: 'Gestión de Órdenes de Trabajo (OT)',
            content: 'Aquí se gestiona el "corazón" del servicio técnico.',
            image: '/assets/manual/ot_list.png',
            bullets: [
                'Filtros (Activas / Finalizadas / Todas): Permite ver solo lo que se está trabajando o el historial.',
                'Botón Exportar Excel: Descarga un reporte completo de tus OTs para contabilidad.'
            ]
        },
        {
            title: 'Modal de Creación de OT',
            content: 'Pasos para recibir un vehículo correctamente.',
            image: '/assets/manual/ot_modal.png',
            bullets: [
                'Buscador de Cliente: Escribe DNI o Patente. Si es nuevo, el sistema te deja cargarlo ahí mismo.',
                'Box Asignado: Elige dónde se va a trabajar el vehículo para llevar el control de ocupación.',
                'Repuestos y Productos: Al buscar un producto aquí, el sistema te muestra el stock disponible.',
                'Rentabilidad MO (%): Por defecto 100%. Si pones 50%, el sistema toma la mitad como ganancia neta.'
            ]
        },
        {
            title: 'Gomería Express (Trabajos Rápidos)',
            content: 'Diseñado para que tu clienta no pierda tiempo.',
            image: '/assets/manual/gomeria.png',
            bullets: [
                'Tarjetas de Servicio: Un solo toque agrega el servicio al carrito.',
                'Botón + PRODUCTO: Te permite sumar un litro de aceite o un filtro a un servicio de gomería.',
                'Cola de Espera: Registra el nombre del cliente para llamarlo cuando su vehículo esté listo.'
            ]
        },
        {
            title: 'Inventario y Fluidos',
            content: 'Control total de mercadería y aceites.',
            image: '/assets/manual/inv.png',
            bullets: [
                'Unidades vs Volumen: Los aceites se marcan como "Volumen" para vender por mililitros.',
                'Lógica de Aceite por $: Si pones "$2000", el sistema calcula los ml a descontar automáticamente.',
                'Niveles de Fluido: El sistema muestra una alerta roja cuando te queda poco.'
            ]
        },
        {
            title: 'Punto de Venta (POS)',
            content: 'La interfaz de facturación rápida con escáner.',
            image: '/assets/manual/pos.png',
            bullets: [
                'Escaneo: Escaneas el producto y se suma al resumen.',
                'Método de Pago: Efectivo, Débito, Crédito, Transferencia o Combinado.',
                'Cerrar Venta: Al cobrar, impacta en caja y baja el stock al instante.'
            ]
        },
        {
            title: 'Auditoría (Acceso de Programador/Dueño)',
            content: 'Protección total contra errores o fraudes.',
            image: '/assets/manual/audit.png',
            bullets: [
                'Registro de Movimientos: Muestra qué usuario hizo qué cambio y en qué momento.',
                'Heatmap (Mapa de Calor): Te informa cuáles son los botones que más usan tus empleados.',
                'Atajo Secreto: Se activa con Ctrl + Alt + A o haciendo 7 clics en el logo superior.'
            ]
        }
    ];

    return (
        <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="card" style={{ padding: '32px', marginBottom: '24px', textAlign: 'center', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-hover))' }}>
                <Icon name="help_center" size={64} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                <h1 style={{ fontSize: '32px', marginBottom: '12px' }}>Centro de Ayuda Piripi Pro</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                    Guía completa paso a paso con capturas reales para dominar cada rincón de la plataforma.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {sections.map((sec, idx) => (
                    <div key={idx} className="card" style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ padding: '24px' }}>
                            <h2 style={{ fontSize: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{idx + 1}</span>
                                {sec.title}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '20px' }}>{sec.content}</p>
                            
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '20px' }}>
                                {sec.bullets.map((b, i) => (
                                    <li key={i} style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{b}</li>
                                ))}
                            </ul>
                        </div>
                        
                        <div style={{ background: 'var(--bg-main)', padding: '20px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                            <img 
                                src={sec.image} 
                                alt={sec.title} 
                                style={{ 
                                    maxWidth: '100%', 
                                    borderRadius: 'var(--radius)', 
                                    boxShadow: 'var(--shadow-lg)',
                                    border: '4px solid var(--bg-card)'
                                }} 
                            />
                            <p style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Captura real de la plataforma Piripi Santa Fe v3.0
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ marginTop: '64px', padding: '32px', textAlign: 'center', border: '2px dashed var(--primary)' }}>
                <h3>¿Necesitas más ayuda?</h3>
                <p style={{ color: 'var(--text-muted)' }}>Contacta al soporte técnico para capacitaciones personalizadas o reportes de bugs.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
                    <button className="btn btn-primary">Contactar Soporte</button>
                    <button className="btn btn-ghost">Reportar un Problema</button>
                </div>
            </div>
        </div>
    );
};
