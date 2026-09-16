import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { rawSupabaseClient } from '../lib/supabase';

// Códigos de validación autorizados
const VALID_UNLOCK_CODES = [
    'VELOCCE-2026',
    'VELOCCE2026',
    'PAGO-PIRIPI-2026',
    'VELOCCE-REACTIVAR-99',
    'LIBERAR-ACCESO-2026'
];

export const LockScreen = ({ message, onUnlock, companyId = 'piripi' }) => {
    const { loginMaster } = useAuth();

    // Estado para código de reactivación de pago
    const [unlockCode, setUnlockCode] = useState('');
    const [unlockError, setUnlockError] = useState('');
    const [unlockSuccess, setUnlockSuccess] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

    // Estado para acceso oculto de desarrollador (Master Admin)
    const [secretClicks, setSecretClicks] = useState(0);
    const [showMasterModal, setShowMasterModal] = useState(false);
    const [masterPin, setMasterPin] = useState('');
    const [masterError, setMasterError] = useState('');

    const bankDetails = {
        alias: 'Smart05',
        cbu: '4530000800017199601156',
        amount: '150 USD',
        amountDetail: '150 USD (o su equivalente en pesos al cambio del día)',
        phoneDisplay: '342 516 2372',
        phoneRaw: '5493425162372'
    };

    const handleCopy = (text, fieldName) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2500);
        }
    };

    const handleLockClick = () => {
        const next = secretClicks + 1;
        setSecretClicks(next);
        if (next >= 5) {
            setShowMasterModal(true);
            setSecretClicks(0);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setUnlockError('');
        const cleanCode = unlockCode.trim().toUpperCase();

        if (!cleanCode) {
            setUnlockError('Por favor ingresá el código de validación.');
            return;
        }

        if (VALID_UNLOCK_CODES.includes(cleanCode)) {
            setUnlockSuccess(true);
            const targetCompany = companyId || 'piripi';
            localStorage.setItem(`velocce_license_unlocked_${targetCompany}_v3`, 'true');
            localStorage.setItem('velocce_license_unlocked_piripi_v3', 'true');
            localStorage.setItem('velocce_license_unlocked_at', new Date().toISOString());
            
            // Reactivar empresa y empleados en la base de datos en tiempo real
            try {
                if (rawSupabaseClient) {
                    await rawSupabaseClient
                        .from('companies')
                        .update({ is_active: true })
                        .eq('id', targetCompany);

                    await rawSupabaseClient
                        .from('employees')
                        .update({ is_active: true })
                        .eq('company_id', targetCompany);
                }
            } catch (err) {
                console.error('Error reactivando en BD:', err);
            }

            setTimeout(() => {
                if (onUnlock) {
                    onUnlock();
                } else {
                    window.location.reload();
                }
            }, 1200);
        } else {
            setUnlockError('Código de validación incorrecto o no reconocido. Verifique con el desarrollador.');
        }
    };

    const handleMasterSubmit = (e) => {
        e.preventDefault();
        setMasterError('');
        if (masterPin === '9999') {
            loginMaster('9999');
            setShowMasterModal(false);
        } else {
            setMasterError('PIN incorrecto');
            setMasterPin('');
        }
    };

    const whatsappMessage = encodeURIComponent(
        'Hola Nico, te envío el comprobante de transferencia por la licencia del sistema Velocce (150 USD) para solicitar el código de validación.'
    );
    const whatsappUrl = `https://wa.me/${bankDetails.phoneRaw}?text=${whatsappMessage}`;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            color: '#f1f5f9',
            fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            overflow: 'auto',
            padding: '24px 16px',
            boxSizing: 'border-box',
            zIndex: 99999999
        }}>
            {/* CSS Animations */}
            <style>{`
                @keyframes pulseGlow {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
                    70% { transform: scale(1.05); box-shadow: 0 0 25px 15px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                @keyframes floatCard {
                    0% { transform: translateY(15px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes floatIcon {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>

            {/* Background Glow Orbs */}
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
                top: '5%',
                left: '10%',
                filter: 'blur(80px)',
                zIndex: 1,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
                bottom: '5%',
                right: '10%',
                filter: 'blur(100px)',
                zIndex: 1,
                pointerEvents: 'none'
            }} />

            {/* Content Card */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                maxWidth: '560px',
                background: 'rgba(15, 23, 42, 0.88)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px',
                padding: '36px 28px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(24px)',
                textAlign: 'center',
                animation: 'floatCard 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}>
                {/* Glowing Lock Icon (5 clicks triggers Master Admin prompt) */}
                <div
                    onClick={handleLockClick}
                    title="Estado del Sistema"
                    style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'radial-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.05) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto 16px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        userSelect: 'none',
                        animation: 'pulseGlow 2.5s infinite ease-in-out, floatIcon 3s infinite ease-in-out'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '34px' }}>lock_clock</span>
                </div>

                {/* Suspension Tag */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.12)',
                    padding: '5px 14px',
                    borderRadius: '100px',
                    marginBottom: '14px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    SUSPENSIÓN POR FALTA DE PAGO
                </div>

                <h1 style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: '8px',
                    letterSpacing: '-0.5px'
                }}>
                    Licencia Temporalmente Inactiva
                </h1>

                <p style={{
                    fontSize: '13px',
                    color: '#94a3b8',
                    lineHeight: '1.5',
                    marginBottom: '20px'
                }}>
                    {message || 'El servicio se encuentra suspendido debido a saldo pendiente de facturación. Para continuar utilizando la plataforma, realice el pago y solicite su código de validación.'}
                </p>

                {/* TARJETA DE DATOS BANCARIOS PARA TRANSFERENCIA */}
                <div style={{
                    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    borderRadius: '18px',
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'left',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#60a5fa' }}>account_balance</span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.3px' }}>
                                DATOS PARA TRANSFERIR
                            </span>
                        </div>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(234, 179, 8, 0.15)',
                            color: '#facc15',
                            border: '1px solid rgba(234, 179, 8, 0.3)'
                        }}>
                            Monto: 150 USD
                        </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '14px', lineHeight: '1.4' }}>
                        Importe a regularizar: <strong style={{ color: '#ffffff', fontSize: '13px' }}>150 USD</strong> <span style={{ color: '#94a3b8' }}>(o su valor equivalente en pesos al cambio del día)</span>.
                    </div>

                    {/* Fila Alias */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '8px'
                    }}>
                        <div>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ALIAS</div>
                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                {bankDetails.alias}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(bankDetails.alias, 'alias')}
                            style={{
                                background: copiedField === 'alias' ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                {copiedField === 'alias' ? 'check' : 'content_copy'}
                            </span>
                            {copiedField === 'alias' ? '¡Copiado!' : 'Copiar Alias'}
                        </button>
                    </div>

                    {/* Fila CBU */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ overflow: 'hidden', marginRight: '10px' }}>
                            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>CBU / CVU</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                {bankDetails.cbu}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(bankDetails.cbu, 'cbu')}
                            style={{
                                background: copiedField === 'cbu' ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                                color: '#ffffff',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                {copiedField === 'cbu' ? 'check' : 'content_copy'}
                            </span>
                            {copiedField === 'cbu' ? '¡Copiado!' : 'Copiar CBU'}
                        </button>
                    </div>

                    {/* BOTÓN DIRECTO DE WHATSAPP */}
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            background: 'linear-gradient(135deg, #25D366, #128C7E)',
                            color: '#ffffff',
                            textDecoration: 'none',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: 800,
                            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
                        Enviar Comprobante por WhatsApp ({bankDetails.phoneDisplay})
                    </a>
                </div>

                {/* Unlock / Reactivation Code Form */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '16px',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#60a5fa' }}>key</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                            Ingresar Código de Validación
                        </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                        Una vez enviada la transferencia, recibirás el código de validación por WhatsApp para desbloquear el sistema de inmediato:
                    </p>

                    {unlockSuccess ? (
                        <div style={{
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '10px',
                            padding: '12px',
                            color: '#4ade80',
                            fontSize: '13px',
                            fontWeight: 700,
                            textAlign: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                            ¡Código verificado con éxito! Reactivando sistema...
                        </div>
                    ) : (
                        <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={unlockCode}
                                    onChange={(e) => setUnlockCode(e.target.value)}
                                    placeholder="Ej: Velocce-2026"
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        color: '#ffffff',
                                        fontSize: '13px',
                                        fontFamily: 'monospace',
                                        fontWeight: 600,
                                        outline: 'none',
                                        letterSpacing: '1px'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        padding: '10px 18px',
                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        whiteSpace: 'nowrap',
                                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check</span>
                                    Validar y Activar
                                </button>
                            </div>
                            {unlockError && (
                                <div style={{ fontSize: '11.5px', color: '#ef4444', fontWeight: 600 }}>
                                    {unlockError}
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Footer instructions */}
                <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingTop: '14px',
                    fontSize: '11.5px',
                    color: '#64748b',
                    lineHeight: '1.4'
                }}>
                    Al ingresar el código de validación correcto, la base de datos y la interfaz se rehabilitan automáticamente en tiempo real.
                </div>
            </div>

            {/* Modal Secreto de Desarrollador (Master PIN) */}
            {showMasterModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 100000000
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '20px',
                        padding: '32px 28px',
                        width: '90%',
                        maxWidth: '360px',
                        textAlign: 'center',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
                    }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#60a5fa' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>hub</span>
                        </div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800 }}>Consola de Rescate</h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#94a3b8' }}>Acceso exclusivo de desarrollador</p>
                        
                        <form onSubmit={handleMasterSubmit}>
                            <input
                                type="password"
                                value={masterPin}
                                onChange={(e) => setMasterPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                autoFocus
                                placeholder="••••"
                                maxLength={4}
                                style={{
                                    width: '160px',
                                    padding: '12px',
                                    fontSize: '24px',
                                    letterSpacing: '12px',
                                    textAlign: 'center',
                                    borderRadius: '10px',
                                    border: `2px solid ${masterError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                                    background: 'rgba(255,255,255,0.04)',
                                    color: '#ffffff',
                                    outline: 'none',
                                    marginBottom: '12px'
                                }}
                            />
                            {masterError && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '12px', fontWeight: 600 }}>{masterError}</div>}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowMasterModal(false); setMasterPin(''); setMasterError(''); }}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#94a3b8',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        padding: '8px 20px',
                                        background: '#2563eb',
                                        border: 'none',
                                        color: '#ffffff',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: 700
                                    }}
                                >
                                    Ingresar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
