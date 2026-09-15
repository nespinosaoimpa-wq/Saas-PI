import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Códigos de desbloqueo autorizados para entregar al cliente cuando regularice su pago
const VALID_UNLOCK_CODES = [
    'PAGO-PIRIPI-2026',
    'VELOCCE-REACTIVAR-99',
    'LIBERAR-ACCESO-2026'
];

export const LockScreen = ({ message, onUnlock }) => {
    const { loginMaster } = useAuth();

    // Estado para código de reactivación de pago
    const [unlockCode, setUnlockCode] = useState('');
    const [unlockError, setUnlockError] = useState('');
    const [unlockSuccess, setUnlockSuccess] = useState(false);

    // Estado para acceso oculto de desarrollador (Master Admin)
    const [secretClicks, setSecretClicks] = useState(0);
    const [showMasterModal, setShowMasterModal] = useState(false);
    const [masterPin, setMasterPin] = useState('');
    const [masterError, setMasterError] = useState('');

    const handleLockClick = () => {
        const next = secretClicks + 1;
        setSecretClicks(next);
        if (next >= 5) {
            setShowMasterModal(true);
            setSecretClicks(0);
        }
    };

    const handleVerifyCode = (e) => {
        e.preventDefault();
        setUnlockError('');
        const cleanCode = unlockCode.trim().toUpperCase();

        if (!cleanCode) {
            setUnlockError('Por favor ingrese un código.');
            return;
        }

        if (VALID_UNLOCK_CODES.includes(cleanCode)) {
            setUnlockSuccess(true);
            localStorage.setItem('velocce_license_unlocked_piripi', 'true');
            localStorage.setItem('velocce_license_unlocked_at', new Date().toISOString());
            
            setTimeout(() => {
                if (onUnlock) {
                    onUnlock();
                } else {
                    window.location.reload();
                }
            }, 1200);
        } else {
            setUnlockError('Código inválido o no reconocido. Contacte al desarrollador.');
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
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
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
                maxWidth: '520px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '40px 32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                textAlign: 'center',
                animation: 'floatCard 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}>
                {/* Glowing Lock Icon (5 clicks triggers Master Admin prompt) */}
                <div
                    onClick={handleLockClick}
                    title="Estado del Sistema"
                    style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        background: 'radial-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.05) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '0 auto 20px',
                        color: '#ef4444',
                        cursor: 'pointer',
                        userSelect: 'none',
                        animation: 'pulseGlow 2.5s infinite ease-in-out, floatIcon 3s infinite ease-in-out'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>lock_person</span>
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
                    background: 'rgba(239, 68, 68, 0.1)',
                    padding: '6px 14px',
                    borderRadius: '100px',
                    marginBottom: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.15)'
                }}>
                    LICENCIA SUSPENDIDA
                </div>

                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: '12px',
                    letterSpacing: '-0.5px'
                }}>
                    Sistema Inactivo
                </h1>

                <p style={{
                    fontSize: '13.5px',
                    color: '#94a3b8',
                    lineHeight: '1.6',
                    marginBottom: '24px'
                }}>
                    {message || 'Esta plataforma se encuentra suspendida por saldo pendiente de facturación e incumplimiento en los términos de licenciamiento acordados.'}
                </p>

                {/* Metadata Panel */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    textAlign: 'left',
                    marginBottom: '24px',
                    fontSize: '12.5px',
                    lineHeight: '1.8'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Aplicación:</span>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>Velocce Santa Fe v3.0</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingTop: '4px', paddingBottom: '4px' }}>
                        <span style={{ color: '#64748b' }}>Estado del Servidor:</span>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>RESTRINGIDO POR MORA</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px' }}>
                        <span style={{ color: '#64748b' }}>Código de Control:</span>
                        <span style={{ fontFamily: 'monospace', color: '#f1f5f9' }}>ERR_LIC_RESTRICTION_PAYMENT</span>
                    </div>
                </div>

                {/* Unlock / Reactivation Code Form */}
                <div style={{
                    background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#60a5fa' }}>key</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                            Reactivar con Código de Pago
                        </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                        Si ya regularizaste el saldo con el desarrollador, ingresá aquí el código de reactivación suministrado:
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
                            ¡Pago acreditado! Reactivando sistema...
                        </div>
                    ) : (
                        <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={unlockCode}
                                    onChange={(e) => setUnlockCode(e.target.value)}
                                    placeholder="Código de desbloqueo"
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        color: '#ffffff',
                                        fontSize: '13px',
                                        fontFamily: 'monospace',
                                        fontWeight: 600,
                                        outline: 'none',
                                        letterSpacing: '1px',
                                        textTransform: 'uppercase'
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
                                    Activar
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
                    paddingTop: '18px',
                    fontSize: '12px',
                    color: '#64748b',
                    lineHeight: '1.5'
                }}>
                    Para regularizar el pago y solicitar el código de reactivación, contacte al desarrollador o administración del sistema.
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
