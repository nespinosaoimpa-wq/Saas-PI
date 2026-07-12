import React from 'react';
import { GlassCard, SectionHeader, Icon } from '../components/ui';

export const MembershipPage = () => {
    return (
        <div className="page-content">
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Hero Header */}
                <div className="card" style={{ 
                    padding: '40px', 
                    marginBottom: '32px', 
                    textAlign: 'center', 
                    background: 'linear-gradient(135deg, rgba(116, 172, 223, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative Background Glows */}
                    <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(116, 172, 223, 0.15) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                    
                    <Icon name="card_membership" size={64} style={{ color: 'var(--primary)', marginBottom: '20px' }} />
                    <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.5px' }}>
                        Licencia & Suscripción
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
                        VELOCCE es una plataforma distribuida exclusivamente bajo la modalidad de <strong>Software como Servicio (SaaS)</strong> desarrollado por <strong>SmartFlow Digital</strong>.
                    </p>
                </div>

                {/* Details Grid */}
                <div className="page-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    
                    {/* Pricing Card */}
                    <GlassCard style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--accent)' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <Icon name="payments" style={{ color: 'var(--accent)' }} size={24} />
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Costo del Alquiler</h3>
                            </div>
                            
                            <div style={{ margin: '24px 0', textAlign: 'center' }}>
                                <span style={{ fontSize: '48px', fontWeight: 900, color: 'var(--text-primary)' }}>100 USD</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '16px' }}> / mes</span>
                            </div>
                            
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                                <li><strong>Vigencia:</strong> Comienza a regir a partir de <strong>Agosto de 2026</strong>.</li>
                                <li><strong>Acceso Completo:</strong> Incluye todos los módulos activos del sistema sin cargos adicionales.</li>
                                <li><strong>Facturación:</strong> Cobro mensual anticipado para la renovación de la clave de licencia.</li>
                            </ul>
                        </div>
                    </GlassCard>

                    {/* What's Included Card */}
                    <GlassCard style={{ padding: '32px', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <Icon name="verified" style={{ color: 'var(--primary)' }} size={24} />
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>¿Qué incluye la Licencia?</h3>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                <Icon name="cloud_sync" size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Base de Datos en la Nube</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Almacenamiento seguro, respaldos automáticos y sincronización en la nube Supabase.</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                <Icon name="update" size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Actualizaciones Continuas</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Acceso automático a nuevas funciones, mejoras visuales y parches de seguridad.</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                <Icon name="support_agent" size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Soporte Técnico</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Asistencia prioritaria frente a incidencias operativas y capacitaciones del personal.</div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* About SmartFlow */}
                <div className="card" style={{ 
                    marginTop: '32px', 
                    padding: '24px 32px', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius)',
                    background: 'var(--bg-hover)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Icon name="dns" style={{ color: 'var(--primary)' }} />
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Sobre el Proveedor del Servicio</h4>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                        Este software es propiedad intelectual registrada y un producto comercializado como <strong>SaaS (Software as a Service)</strong> por <strong>SmartFlow Digital</strong>. El pago del alquiler mensual concede el derecho de uso no exclusivo de la plataforma. La falta de pago resultará en la suspensión temporal o definitiva del servicio de acuerdo con los términos de contratación.
                    </p>
                </div>

                {/* Contact Section */}
                <div style={{ marginTop: '48px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                        Para coordinar métodos de pago o consultas de licenciamiento:
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                        <button className="btn btn-primary" onClick={() => window.open('https://wa.me/5493425162372?text=Hola!%20Tengo%20una%20consulta%20sobre%20la%20licencia%20de%20Velocce%20Pro', '_blank')}>
                            <Icon name="chat" size={18} /> Contactar Administración
                        </button>
                        <button className="btn btn-ghost" onClick={() => window.open('mailto:smartflow.1995@gmail.com?subject=Consulta%20Licenciamiento%20-%20Velocce%20Pro', '_blank')}>
                            <Icon name="mail" size={18} /> Enviar Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
