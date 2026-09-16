import React, { useState } from 'react';
import { Icon } from './Icon';
import { supabase, currentCompanyId } from '../../lib/supabase';

export function MembershipRegistrationModal({ isOpen, user, onCompleted }) {
    const [name, setName] = useState(user?.name || '');
    const [dni, setDni] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const cleanName = name.trim();
        const cleanDni = dni.trim();
        const cleanPhone = phone.trim();
        const cleanEmail = email.trim();

        if (!cleanName) {
            setError('Por favor ingrese el nombre del administrador.');
            return;
        }
        if (!cleanDni || cleanDni.length < 7) {
            setError('Por favor ingrese un número de DNI válido (mínimo 7 dígitos).');
            return;
        }
        if (!cleanPhone || cleanPhone.length < 8) {
            setError('Por favor ingrese un teléfono o WhatsApp de contacto válido.');
            return;
        }
        if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
            setError('Por favor ingrese un correo electrónico válido.');
            return;
        }

        setLoading(true);

        const submittedAt = new Date().toISOString();
        const submissionPayload = {
            admin_name: cleanName,
            dni: cleanDni,
            phone: cleanPhone,
            email: cleanEmail,
            role: user?.role || 'admin',
            employee_id: user?.id,
            company_id: currentCompanyId,
            submitted_at: submittedAt,
            status: 'COMPLETED'
        };

        try {
            // 1. Guardar en Base de Datos Supabase (audit_logs con clave indexada)
            const { error: dbError } = await supabase.from('audit_logs').insert([{
                company_id: currentCompanyId,
                employee_id: user?.id || null,
                action: 'MEMBERSHIP_INSCRIPTION',
                details: JSON.stringify(submissionPayload),
                path: '/membership'
            }]);

            if (dbError) {
                console.error('Error guardando en Supabase:', dbError);
                throw new Error('Error al registrar en la base de datos: ' + dbError.message);
            }

            // 2. Guardar persistencia local inmediata
            localStorage.setItem(`velocce_membership_completed_${currentCompanyId}`, 'true');
            localStorage.setItem(`velocce_membership_data_${currentCompanyId}`, JSON.stringify(submissionPayload));

            // 3. Enviar notificación por correo a tic.espinosa@gmail.com
            const emailData = {
                _subject: `🔔 NUEVA INSCRIPCIÓN DE MEMBRESÍA: ${currentCompanyId.toUpperCase()}`,
                empresa: currentCompanyId.toUpperCase(),
                administrador: cleanName,
                dni: cleanDni,
                telefono_contacto: cleanPhone,
                correo_oficial: cleanEmail,
                fecha_hora: new Date().toLocaleString('es-AR'),
                sistema: 'VELOCCE PRO - Sistema de Gestión',
                id_empleado: user?.id || 'N/A'
            };

            // Intentar envío vía FormSubmit API
            try {
                await fetch('https://formsubmit.co/ajax/tic.espinosa@gmail.com', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(emailData)
                });
            } catch (mailErr) {
                console.warn('FormSubmit envio diferido/background:', mailErr);
            }

            // Intentar envío secundario vía endpoint de backup de la plataforma
            try {
                await fetch('/api/notify-membership', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailData)
                });
            } catch (apiErr) {
                // Silencioso si no está en Vercel
            }

            // 4. Notificar vía Realtime para que se cierre en las demás terminales
            try {
                const channel = supabase.channel('velocce-system-updates');
                await channel.subscribe();
                await channel.send({
                    type: 'broadcast',
                    event: 'membership-registered',
                    payload: submissionPayload
                });
            } catch (rtErr) {
                console.warn('Realtime broadcast error:', rtErr);
            }

            setSuccess(true);
            setTimeout(() => {
                if (onCompleted) onCompleted(submissionPayload);
            }, 1600);

        } catch (err) {
            setError(err.message || 'Ocurrió un error al procesar el formulario.');
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 999999, backdropFilter: 'blur(12px)', background: 'rgba(0, 0, 0, 0.85)' }}>
            <div className="modal-box" style={{ maxWidth: 540, border: '1px solid rgba(245, 158, 11, 0.4)', boxShadow: '0 25px 70px rgba(0,0,0,0.85), 0 0 30px rgba(245, 158, 11, 0.2)' }}>
                {/* Header estilo Lamborghini Pit Telemetry */}
                <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ 
                            fontFamily: 'var(--font-racing)', 
                            fontSize: '10px', 
                            fontWeight: 800, 
                            color: '#fbbf24', 
                            background: 'rgba(245, 158, 11, 0.15)', 
                            padding: '3px 10px', 
                            borderRadius: '4px', 
                            letterSpacing: '1.2px',
                            border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                            OBLIGATORIO // TITULAR ADMINISTRATIVO
                        </span>
                        <span style={{ fontFamily: 'var(--font-racing)', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px' }}>
                            EMPRESA: PIRIPI
                        </span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-racing)', fontSize: '20px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px', margin: 0 }}>
                        Inscripción de Membresía Oficial
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', marginBottom: 0, lineHeight: 1.4 }}>
                        Para garantizar la vigencia de la licencia y la vinculación de su taller, es requisito obligatorio completar los datos del administrador titular.
                    </p>
                </div>

                {/* Formulario o Pantalla de Éxito */}
                {success ? (
                    <div style={{ padding: '40px 28px', textAlign: 'center' }}>
                        <div style={{ 
                            width: 68, 
                            height: 68, 
                            borderRadius: '50%', 
                            background: 'rgba(16, 185, 129, 0.15)', 
                            border: '2px solid #10b981', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            margin: '0 auto 16px' 
                        }}>
                            <Icon name="check_circle" size={38} style={{ color: '#10b981' }} />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-racing)', fontSize: '22px', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
                            ¡INSCRIPCIÓN REGISTRADA!
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
                            Los datos de contacto administrativo han sido guardados con éxito en el servidor y notificados a la administración central. Por favor, recuerde proceder con la regularización del pago del plan.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ padding: '24px 28px' }}>
                        {/* ALERTA OBLIGATORIA: SUSCRIPCIÓN A PLAN DE PAGO */}
                        <div style={{
                            padding: '14px 16px',
                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(245, 158, 11, 0.1) 100%)',
                            border: '1px solid rgba(239, 68, 68, 0.45)',
                            borderLeft: '4px solid #ef4444',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <Icon name="warning" size={20} style={{ color: '#ef4444' }} />
                                <strong style={{ fontFamily: 'var(--font-racing)', fontSize: '13px', color: '#fbbf24', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                                    Estado de Cuenta: Suscripción a Plan de Pago Activa
                                </strong>
                            </div>
                            <p style={{ color: '#f8fafc', fontSize: '12.5px', lineHeight: 1.5, margin: 0 }}>
                                Se le notifica que este taller se encuentra formalmente <strong>suscrito al plan de pago de licenciamiento</strong> de VELOCCE PRO. 
                                <strong style={{ color: '#f87171' }}> Es estrictamente necesario realizar el pago correspondiente</strong> para mantener la vigencia del servicio y evitar la interrupción de las funciones operativas de caja y boxes.
                            </p>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '11px', color: 'var(--text-muted)' }}>
                                <span>📋 Estado: <strong style={{ color: '#fbbf24' }}>Suscrito a Plan Comercial</strong></span>
                                <span>💳 Situación: <strong style={{ color: '#ef4444' }}>Pago Pendiente de Regularización</strong></span>
                            </div>
                        </div>

                        {error && (
                            <div style={{ 
                                padding: '10px 14px', 
                                background: 'rgba(239, 68, 68, 0.15)', 
                                border: '1px solid rgba(239, 68, 68, 0.4)', 
                                borderRadius: 'var(--radius-sm)', 
                                color: '#f87171', 
                                fontSize: '13px', 
                                marginBottom: '18px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px' 
                            }}>
                                <Icon name="error" size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icon name="person" size={15} style={{ color: '#fbbf24' }} />
                                    Nombre y Apellido del Administrador
                                </label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Esteban Gómez"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon name="badge" size={15} style={{ color: '#fbbf24' }} />
                                        DNI / Documento
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 9))}
                                        placeholder="Ej: 34123456"
                                        disabled={loading}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Icon name="call" size={15} style={{ color: '#fbbf24' }} />
                                        Teléfono / WhatsApp
                                    </label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Ej: 342-4567890"
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Icon name="mail" size={15} style={{ color: '#fbbf24' }} />
                                    Correo Electrónico Oficial
                                </label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Ej: administracion@piripi.com"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '26px' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{ width: '100%', padding: '14px', fontSize: '14px', justifyContent: 'center', letterSpacing: '1px' }}
                            >
                                <Icon name={loading ? 'sync' : 'verified'} size={20} className={loading ? 'spin' : ''} />
                                <span>{loading ? 'REGISTRANDO Y NOTIFICANDO...' : 'CONFIRMAR Y GUARDAR REGISTRO'}</span>
                            </button>
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', marginTop: '10px', marginBottom: 0 }}>
                                Se enviará constancia a tic.espinosa@gmail.com y quedará asentado en el sistema.
                            </p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
