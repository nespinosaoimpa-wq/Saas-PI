import React, { useState } from 'react';
import { GlassCard, SectionHeader, Icon } from '../components/ui';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const MembershipPage = () => {
    const { exportToExcel, logAudit } = useApp();
    const { user } = useAuth();

    // Estado del Contrato
    const [accepted, setAccepted] = useState(false);
    const [isSigned, setIsSigned] = useState(() => localStorage.getItem('velocce_contract_signed') === 'true');
    const [signDetails, setSignDetails] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('velocce_contract_sign_details')) || null;
        } catch { return null; }
    });

    const handleAcceptContract = async () => {
        if (!accepted) return;
        
        const details = {
            firmante: user.name || user.full_name || 'Administrador Principal',
            rol: user.role?.toUpperCase() || 'ADMIN',
            email: user.email || 'N/A',
            fecha: new Date().toLocaleString('es-AR'),
            timestamp: new Date().toISOString()
        };

        // Guardar firma localmente
        localStorage.setItem('velocce_contract_signed', 'true');
        localStorage.setItem('velocce_contract_sign_details', JSON.stringify(details));
        setIsSigned(true);
        setSignDetails(details);

        // Registrar firma en logs de Supabase (Auditoría Inmutable en Base de Datos)
        await logAudit('Firma Contrato Virtual', {
            ...details,
            status: 'CONTRATO_ACEPTADO_VINCULANTE'
        });

        alert('✅ ¡Contrato firmado digitalmente y registrado con éxito!');
    };

    const handleExportBackup = () => {
        // Export principal tables for safety
        exportToExcel('work_orders');
        setTimeout(() => exportToExcel('inventory'), 600);
        setTimeout(() => exportToExcel('payments'), 1200);
        
        // Log auditing download
        logAudit('Exportar Datos por Desacuerdo de Políticas', {
            user: user.name,
            timestamp: new Date().toISOString()
        });

        alert('📥 Generando descargas de Copias de Seguridad (Excel). Por favor, guardá los archivos generados en tu computadora.');
    };

    return (
        <div className="page-content">
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {/* Hero Header */}
                <div className="card" style={{ 
                    padding: '40px 32px', 
                    marginBottom: '32px', 
                    textAlign: 'center', 
                    background: 'linear-gradient(135deg, rgba(116, 172, 223, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(116, 172, 223, 0.15) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                    
                    <Icon name="gavel" size={56} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                    <h1 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                        Contrato Virtual de Licencia
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
                        Términos y condiciones comerciales y de seguridad de datos para el uso de la plataforma <strong>VELOCCE PRO</strong> provista por <strong>SmartFlow Digital</strong>.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                    
                    {/* Contrato / Políticas */}
                    <GlassCard style={{ padding: '32px' }}>
                        <SectionHeader icon="description" title="Términos, Políticas y Condiciones de Servicio" />
                        
                        <div style={{ 
                            maxHeight: '380px', 
                            overflowY: 'auto', 
                            background: 'rgba(0,0,0,0.2)', 
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            padding: '24px',
                            fontSize: '14px',
                            lineHeight: '1.7',
                            color: 'var(--text-secondary)',
                            marginBottom: '24px'
                        }}>
                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 800 }}>1. Políticas de Seguridad de Datos y Privacidad</h4>
                            <p style={{ marginBottom: '16px' }}>
                                VELOCCE PRO garantiza la total confidencialidad de la información registrada. Todos los datos referidos a clientes, patentes de vehículos, fichas técnicas e inventario son almacenados de forma cifrada y segura en la infraestructura cloud de Supabase. SmartFlow Digital no comercializa, transfiere ni comparte ningún dato con terceros ajenos al Lubricentro licenciatario.
                            </p>

                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 800 }}>2. Políticas de Cobro y Alquiler de Licencia</h4>
                            <p style={{ marginBottom: '16px' }}>
                                El uso de la plataforma VELOCCE PRO se otorga mediante una licencia bajo modalidad de <strong>Software como Servicio (SaaS)</strong>. 
                                El costo mensual del alquiler del software está fijado en **100 USD (cien dólares estadounidenses)**.
                                Los períodos de facturación son mensuales y adelantados, debiéndose abonar entre los días 1 y 10 de cada mes corriente. Esta política comenzará a regir a partir de <strong>Agosto de 2026</strong>.
                            </p>

                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 800 }}>3. Políticas de Mora y Suspensión de Cuenta</h4>
                            <p style={{ marginBottom: '16px' }}>
                                El retraso en el pago del canon mensual por más de 5 días corridos a partir de la fecha de vencimiento (día 10 de cada mes) facultará a SmartFlow Digital a la <strong>suspensión temporal del acceso</strong> a la plataforma mediante una pantalla de bloqueo.
                                Transcurridos 30 días consecutivos de mora, se procederá a la <strong>baja definitiva</strong> de la cuenta y sus accesos asociados.
                            </p>

                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 800 }}>4. Portabilidad y Exportación de Datos (Copia de Seguridad)</h4>
                            <p style={{ marginBottom: '16px' }}>
                                SmartFlow Digital reconoce la propiedad absoluta de la información de negocio registrada en el sistema por parte del cliente. En caso de suspensión por falta de pago o desacuerdo con futuras políticas comerciales, el sistema mantendrá habilitada la función de <strong>portabilidad</strong>, permitiendo al cliente exportar todo el histórico de su negocio (Órdenes de Trabajo, Inventario, Caja e Historiales) en formato Excel en cualquier momento.
                            </p>

                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 800 }}>5. Validez del Contrato Virtual</h4>
                            <p style={{ marginBottom: '0' }}>
                                La confirmación a través de esta sección mediante la casilla de verificación y el botón "Aceptar" constituye la firma de un **Contrato Virtual vinculante** entre el Lubricentro/Taller y SmartFlow Digital, declarando conocer y aceptar el alcance del licenciamiento y las obligaciones comerciales aquí estipuladas.
                            </p>
                        </div>
                    </GlassCard>

                    {/* Interactive Signature Area */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        
                        {/* Signature Box */}
                        <GlassCard style={{ 
                            padding: '32px', 
                            border: isSigned ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border)',
                            background: isSigned ? 'linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.03) 100%)' : 'var(--bg-card)'
                        }}>
                            <SectionHeader icon="fingerprint" title={isSigned ? "Contrato Firmado" : "Firma del Contrato"} />
                            
                            {!isSigned ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <label style={{ 
                                        display: 'flex', 
                                        gap: '12px', 
                                        cursor: 'pointer', 
                                        fontSize: '13px', 
                                        color: 'var(--text-primary)',
                                        lineHeight: '1.5'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            checked={accepted} 
                                            onChange={e => setAccepted(e.target.checked)} 
                                            style={{ marginTop: '3px' }}
                                        />
                                        <span>Acepto y declaro total conformidad con las políticas de seguridad de datos, políticas de cobro y términos de suspensión de cuenta detallados en este contrato de VELOCCE PRO.</span>
                                    </label>

                                    <button 
                                        className="btn btn-primary btn-lg" 
                                        disabled={!accepted} 
                                        onClick={handleAcceptContract}
                                        style={{ 
                                            width: '100%', 
                                            justifyContent: 'center', 
                                            height: '48px',
                                            fontWeight: 700,
                                            boxShadow: accepted ? '0 4px 14px rgba(var(--primary-rgb), 0.3)' : 'none'
                                        }}
                                    >
                                        <Icon name="done_all" size={20} /> ACEPTAR CONTRATO VIRTUAL
                                    </button>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                    <div style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        color: 'var(--success)', 
                                        fontWeight: '800', 
                                        fontSize: '15px', 
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        background: 'var(--success-light)',
                                        padding: '8px 16px',
                                        borderRadius: '100px',
                                        marginBottom: '20px'
                                    }}>
                                        <Icon name="verified" size={18} /> Contrato Activo y Vinculante
                                    </div>
                                    <div style={{ 
                                        textAlign: 'left', 
                                        background: 'rgba(0,0,0,0.15)', 
                                        border: '1px solid var(--border)', 
                                        borderRadius: '12px', 
                                        padding: '16px', 
                                        fontSize: '13px',
                                        lineHeight: '1.8',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <div><strong>Firmante:</strong> <span style={{ color: 'var(--text-primary)' }}>{signDetails?.firmante}</span></div>
                                        <div><strong>Rol de Acceso:</strong> <span style={{ color: 'var(--text-primary)' }}>{signDetails?.rol}</span></div>
                                        <div><strong>Usuario Email:</strong> <span style={{ color: 'var(--text-primary)' }}>{signDetails?.email}</span></div>
                                        <div><strong>Fecha de Firma:</strong> <span style={{ color: 'var(--text-primary)' }}>{signDetails?.fecha}</span></div>
                                        <div style={{ marginTop: '8px', borderTop: '1px dashed var(--border)', paddingTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                            HASH_SIGN: {signDetails?.timestamp ? btoa(signDetails.timestamp).slice(0, 16) : 'N/A'}
                                        </div>
                                    </div>
                                    {user && user.role === 'admin' && (
                                        <button 
                                            onClick={() => {
                                                localStorage.removeItem('velocce_contract_signed');
                                                localStorage.removeItem('velocce_contract_sign_details');
                                                setIsSigned(false);
                                                setSignDetails(null);
                                                setAccepted(false);
                                            }}
                                            style={{ 
                                                marginTop: '16px', 
                                                fontSize: '11px', 
                                                color: 'var(--text-muted)', 
                                                background: 'none', 
                                                border: 'none', 
                                                cursor: 'pointer', 
                                                textDecoration: 'underline' 
                                            }}
                                        >
                                            Restablecer firma (Solo Admin / Pruebas)
                                        </button>
                                    )}
                                </div>
                            )}
                        </GlassCard>

                        {/* Export / Data Portability Card */}
                        <GlassCard style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <Icon name="download" style={{ color: 'var(--primary)' }} size={24} />
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Portabilidad de Datos</h3>
                                </div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                                    Si no estás de acuerdo con los términos de licenciamiento o planeas dar de baja tu suscripción, podés resguardar toda la información cargada en el sistema (Órdenes de Trabajo, Caja del Día e Inventario) descargando un respaldo en formato de planillas Excel.
                                </p>
                            </div>
                            
                            <button 
                                className="btn btn-ghost" 
                                onClick={handleExportBackup}
                                style={{ 
                                    width: '100%', 
                                    justifyContent: 'center', 
                                    border: '1px dashed var(--border)',
                                    color: 'var(--primary)',
                                    height: '46px'
                                }}
                            >
                                <Icon name="cloud_download" size={18} /> EXPORTAR TODOS MIS DATOS
                            </button>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
};
