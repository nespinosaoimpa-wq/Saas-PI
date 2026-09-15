import React from 'react';

export const InvalidLinkScreen = ({ currentHost }) => {
    const officialUrl = 'https://velocce-saas.vercel.app/';

    const handleGoOfficial = () => {
        window.location.href = officialUrl;
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
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            color: '#f1f5f9',
            fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            overflow: 'hidden',
            zIndex: 99999999
        }}>
            {/* Background Orbs */}
            <div style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.09) 0%, transparent 70%)',
                top: '10%',
                left: '15%',
                filter: 'blur(90px)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
                bottom: '10%',
                right: '15%',
                filter: 'blur(100px)',
                pointerEvents: 'none'
            }} />

            {/* Main Card */}
            <div style={{
                position: 'relative',
                zIndex: 10,
                width: '90%',
                maxWidth: '560px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '24px',
                padding: '48px 40px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                textAlign: 'center'
            }}>
                {/* Icon */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    margin: '0 auto 24px',
                    color: '#ef4444'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>link_off</span>
                </div>

                {/* Badge */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.12)',
                    padding: '6px 14px',
                    borderRadius: '100px',
                    marginBottom: '16px',
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                    ENLACE DADO DE BAJA
                </div>

                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginBottom: '12px',
                    letterSpacing: '-0.5px'
                }}>
                    Acceso Anulado
                </h1>

                <p style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    lineHeight: '1.6',
                    marginBottom: '28px'
                }}>
                    Este enlace ({currentHost || 'dominio previo'}) ha sido cancelado y dado de baja permanentemente. El sistema ahora opera exclusivamente desde su dirección oficial y protegida.
                </p>

                {/* Target URL Preview Box */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginBottom: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    textAlign: 'left'
                }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Único Dominio Oficial Autorizado:
                    </span>
                    <a
                        href={officialUrl}
                        style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: '#60a5fa',
                            textDecoration: 'none',
                            wordBreak: 'break-all',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock</span>
                        velocce-saas.vercel.app
                    </a>
                </div>

                {/* Action button */}
                <button
                    onClick={handleGoOfficial}
                    style={{
                        width: '100%',
                        padding: '14px 24px',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                    Ir al Enlace Oficial
                </button>

                {/* Footer status */}
                <div style={{
                    marginTop: '24px',
                    fontSize: '11px',
                    color: '#475569',
                    letterSpacing: '0.5px'
                }}>
                    ESTADO: ERR_DOMAIN_REVOKED // CÓDIGO: 410_GONE
                </div>
            </div>
        </div>
    );
};
