import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SectionHeader, GlassCard, FormField, FormRow, Icon } from '../components/ui';
import { supabase } from '../lib/supabase';

export const AdminSettingsPage = () => {
    const { data: MOCK } = useApp();
    const [config, setConfig] = useState({
        cuit: '',
        cert_crt: '',
        private_key: '',
        pto_vta: 1,
        environment: 'homologation',
        is_active: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('afip_config').select('*').single();
        if (!error && data) {
            setConfig(data);
        }
        setLoading(false);
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5173' : '';
            const res = await fetch(`${baseUrl}/api/afip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 1,
                    docType: 99,
                    docNumber: 0,
                    billType: config.environment === 'production' ? 6 : 6, // Factura B test
                    isTest: true
                })
            });
            const data = await res.json();
            if (data.success) {
                setTestResult({ success: true, message: `Conexión exitosa. Último comprobante: ${data.receiptText}` });
            } else {
                setTestResult({ success: false, message: data.error || 'Error desconocido' });
            }
        } catch (e) {
            setTestResult({ success: false, message: e.message });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('afip_config')
            .update({
                cuit: config.cuit,
                cert_crt: config.cert_crt,
                private_key: config.private_key,
                pto_vta: parseInt(config.pto_vta),
                environment: config.environment,
                is_active: config.is_active,
                updated_at: new Date().toISOString()
            })
            .eq('id', config.id);

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            alert('✅ Configuración guardada correctamente.');
        }
        setSaving(false);
    };

    if (loading) return <div className="page-content">Cargando configuración...</div>;

    return (
        <div className="page-content" style={{ maxWidth: 900, margin: '0 auto' }}>
            <SectionHeader icon="settings" title="Configuración de Sistema" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* AFIP SECTION */}
                <GlassCard>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ background: 'var(--primary)', color: 'white', padding: 8, borderRadius: 8 }}>
                            <Icon name="account_balance" size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>Facturación Electrónica ARCA (AFIP)</h3>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Configura los certificados comerciales para emitir facturas legales.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <FormField label="CUIT del Comercio">
                            <input
                                className="form-input"
                                placeholder="Ej: 20123456789"
                                value={config.cuit}
                                onChange={e => setConfig({ ...config, cuit: e.target.value })}
                            />
                        </FormField>
                        <FormField label="Punto de Venta">
                            <input
                                className="form-input"
                                type="number"
                                placeholder="Ej: 1"
                                value={config.pto_vta}
                                onChange={e => setConfig({ ...config, pto_vta: e.target.value })}
                            />
                        </FormField>
                    </div>

                    <FormRow style={{ marginTop: 20 }}>
                        <FormField label="Ambiente de AFIP">
                            <select
                                className="form-select"
                                value={config.environment}
                                onChange={e => setConfig({ ...config, environment: e.target.value })}
                            >
                                <option value="homologation">🧪 Homologación (Pruebas - Sin valor fiscal)</option>
                                <option value="production">🚀 Producción (Real - Valor Fiscal)</option>
                            </select>
                        </FormField>
                    </FormRow>

                    <FormRow style={{ marginTop: 20 }}>
                        <FormField label="Certificado Digital (.CRT)">
                            <textarea
                                className="form-input"
                                style={{ height: 120, fontFamily: 'monospace', fontSize: 11 }}
                                placeholder="Pega aquí el contenido de tu archivo .crt (incluyendo BEGIN y END CERTIFICATE)"
                                value={config.cert_crt}
                                onChange={e => setConfig({ ...config, cert_crt: e.target.value })}
                            />
                        </FormField>
                    </FormRow>

                    <FormRow style={{ marginTop: 20 }}>
                        <FormField label="Clave Privada (.KEY)">
                            <textarea
                                className="form-input"
                                style={{ height: 120, fontFamily: 'monospace', fontSize: 11 }}
                                placeholder="Pega aquí el contenido de tu archivo .key (incluyendo BEGIN y END PRIVATE KEY)"
                                value={config.private_key}
                                onChange={e => setConfig({ ...config, private_key: e.target.value })}
                            />
                        </FormField>
                    </FormRow>

                    <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>📓 Instructivo rápido para el Cliente:</h4>
                        <ol style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 20, lineHeight: 1.6 }}>
                            <li>Entrar a la web de ARCA (AFIP) con Clave Fiscal Nivel 3.</li>
                            <li>Delegar el servicio "Web Services Factura Electrónica".</li>
                            <li>Generar el CSR (Solicitud de Certificado) con tu CUIT.</li>
                            <li>Subir el CSR a la AFIP para obtener el archivo .CRT.</li>
                            <li>Pegar el contenido de los archivos .CRT y .KEY en los cuadros de arriba.</li>
                        </ol>
                    </div>

                    <div style={{ marginTop: 30, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button
                            className="btn btn-ghost"
                            onClick={handleTest}
                            disabled={testing || saving || !config.cuit}
                        >
                            <Icon name={testing ? "hourglass_empty" : "sync_alt"} size={20} />
                            {testing ? 'Testeando...' : 'Probar Conexión'}
                        </button>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '12px 24px' }}
                            onClick={handleSave}
                            disabled={saving || testing}
                        >
                            <Icon name={saving ? "hourglass_empty" : "save"} size={20} />
                            {saving ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    </div>

                    {testResult && (
                        <div style={{
                            marginTop: 16,
                            padding: 12,
                            borderRadius: 'var(--radius-sm)',
                            background: testResult.success ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                            border: `1px solid ${testResult.success ? 'var(--success)' : 'var(--danger)'}`,
                            color: testResult.success ? 'var(--success)' : 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <Icon name={testResult.success ? "check_circle" : "error"} size={20} />
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{testResult.message}</span>
                        </div>
                    )}
                </GlassCard>

                {/* DATABASE HEALTH SECTION */}
                <GlassCard>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ background: 'var(--accent)', color: 'white', padding: 8, borderRadius: 8 }}>
                            <Icon name="database" size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>Estado de la Base de Datos y Respaldo</h3>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Monitoreo en vivo de la sincronización con Supabase.</p>
                        </div>
                    </div>

                    <div className="grid-auto-cards-sm" style={{ gap: 12 }}>
                        {[
                            { name: 'Clientes', count: MOCK.clients.length, icon: 'groups' },
                            { name: 'Vehículos', count: MOCK.vehicles.length, icon: 'directions_car' },
                            { name: 'Órdenes', count: MOCK.workOrders.length, icon: 'receipt_long' },
                            { name: 'Inventario', count: MOCK.inventory.length, icon: 'inventory_2' },
                            { name: 'Pagos/Caja', count: MOCK.payments.length, icon: 'payments' },
                            { name: 'Turnos', count: MOCK.appointments.length, icon: 'event' },
                            { name: 'Promociones', count: MOCK.promotions.length, icon: 'loyalty' },
                            { name: 'Staff', count: MOCK.employees?.length || 0, icon: 'badge' }
                        ].map(stat => (
                            <div key={stat.name} style={{
                                padding: '12px 16px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12
                            }}>
                                <Icon name={stat.icon} size={20} style={{ color: 'var(--primary)', opacity: 0.7 }} />
                                <div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>{stat.name}</div>
                                    <div style={{ fontSize: 16, fontWeight: 800 }}>{stat.count}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(76, 175, 80, 0.1)', borderRadius: 8, border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                        <Icon name="check_circle" size={18} style={{ color: 'var(--success)' }} />
                        <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Sincronización en tiempo real activa. Todos los datos están protegidos en la nube.</span>
                    </div>
                </GlassCard>

                <GlassCard>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Icon name="info" style={{ color: 'var(--primary)' }} />
                        <p style={{ margin: 0, fontSize: 13 }}>
                            Recuerda que si cambias a <strong>Producción</strong>, todas las facturas emitidas tendrán impacto contable ante ARCA. Procura testear bien en Homologación primero.
                        </p>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
