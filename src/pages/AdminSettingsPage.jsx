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
                            className="btn btn-primary"
                            style={{ padding: '12px 24px' }}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Icon name={saving ? "hourglass_empty" : "save"} size={20} />
                            {saving ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
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
