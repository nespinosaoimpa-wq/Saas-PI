import React from 'react';

export const LockScreen = () => {
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
            overflow: 'hidden',
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
                width: '90%',
                maxWidth: '540px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '48px 40px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                textAlign: 'center',
                animation: 'floatCard 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}>
                {/* Glowing Lock Icon */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.05) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '0 auto 28px',
                    color: '#ef4444',
                    animation: 'pulseGlow 2.5s infinite ease-in-out, floatIcon 3s infinite ease-in-out'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '38px' }}>lock_person</span>
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
                    marginBottom: '20px',
                    border: '1px solid rgba(239, 68, 68, 0.15)'
                }}>
                    LICENCIA SUSPENDIDA
                </div>

                <h1 style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: '16px',
                    letterSpacing: '-0.5px'
                }}>
                    Sistema Inactivo
                </h1>

                <p style={{
                    fontSize: '14.5px',
                    color: '#94a3b8',
                    lineHeight: '1.65',
                    marginBottom: '28px'
                }}>
                    Esta plataforma de software se encuentra temporalmente fuera de servicio debido al incumplimiento de los términos de pago acordados para su licenciamiento e implementación.
                </p>

                {/* Metadata Panel */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    textAlign: 'left',
                    marginBottom: '32px',
                    fontSize: '13px',
                    lineHeight: '1.8'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>Aplicación:</span>
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>Velocce Santa Fe v3.0</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', paddingBottom: '6px' }}>
                        <span style={{ color: '#64748b' }}>Estado del Servidor:</span>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>RESTRINGIDO</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px' }}>
                        <span style={{ color: '#64748b' }}>Código de Control:</span>
                        <span style={{ fontFamily: 'monospace', color: '#f1f5f9' }}>ERR_LIC_RESTRICTION_PAYMENT</span>
                    </div>
                </div>

                {/* Instructions / Footer */}
                <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingTop: '24px',
                    fontSize: '13px',
                    color: '#64748b',
                    lineHeight: '1.5'
                }}>
                    Para restablecer el acceso completo y normalizar el estado de su cuenta, por favor comuníquese con el desarrollador o administrador del sistema.
                </div>
            </div>
        </div>
    );
};
