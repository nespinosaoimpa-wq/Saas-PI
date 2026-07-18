import React, { useState, useEffect, useMemo } from 'react';
import { supabase, rawSupabaseClient } from '../lib/supabase';
import { Icon, GlassCard, SectionHeader, StatusBadge } from '../components/ui';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../data/data';

export function ProgrammerAuditPage() {
    const { exportToExcel } = useApp();
    const [logs, setLogs] = useState([]);
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('logs');
    const [searchTerm, setSearchTerm] = useState('');

    // Estados para Gestión SaaS
    const [newCompanyId, setNewCompanyId] = useState('');
    const [newCompanyName, setNewCompanyName] = useState(''); // Nombre fantasía opcional
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminPin, setNewAdminPin] = useState('');
    const [companyList, setCompanyList] = useState([]);
    const [saasLoading, setSaasLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [logsRes, clicksRes] = await Promise.all([
                supabase.from('audit_logs').select('*, employees(name)').order('created_at', { ascending: false }).limit(200),
                supabase.from('button_clicks').select('*').order('count', { ascending: false })
            ]);

            if (logsRes.data) setLogs(logsRes.data);
            if (clicksRes.data) setClicks(clicksRes.data);
        } catch (e) {
            console.error('Error cargando auditoría:', e);
        }
        setLoading(false);
    };

    // Cargar Lista de Empresas para la pestaña SaaS
    const loadSaaSData = async () => {
        if (!rawSupabaseClient) return;
        setSaasLoading(true);
        try {
            const [compRes, empRes] = await Promise.all([
                rawSupabaseClient.from('companies').select('*').order('id', { ascending: true }),
                rawSupabaseClient.from('employees').select('company_id, name, role')
            ]);

            if (compRes.error) throw compRes.error;
            if (empRes.error) throw empRes.error;

            const comps = compRes.data || [];
            const emps = empRes.data || [];

            const processedCompanies = comps.map(c => {
                const companyEmployees = emps.filter(e => (e.company_id || 'piripi') === c.id);
                const adminEmp = companyEmployees.find(e => e.role === 'admin');
                return {
                    ...c,
                    employees_count: companyEmployees.length,
                    admin_name: c.contract_accepted_by || (adminEmp ? adminEmp.name : 'Sin Admin')
                };
            });

            setCompanyList(processedCompanies);
        } catch (e) {
            console.error('Error cargando empresas SaaS:', e);
        }
        setSaasLoading(false);
    };

    useEffect(() => {
        if (tab === 'saas') {
            loadSaaSData();
        }
    }, [tab]);

    const handleCreateTenant = async (e) => {
        e.preventDefault();
        if (!newCompanyId || !newAdminName || !newAdminPin) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        // Limpiar el identificador (letras minúsculas y números solamente)
        const cleanId = newCompanyId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
        if (cleanId.length === 0) {
            alert('El identificador debe ser alfanumérico en minúsculas.');
            return;
        }

        setSaasLoading(true);
        try {
            // 1. Registrar primer empleado (Admin) usando el cliente raw sin filtros
            const { error: empError } = await rawSupabaseClient.from('employees').insert([{
                name: newAdminName.trim(),
                role: 'admin',
                pin: newAdminPin.trim(),
                company_id: cleanId,
                is_active: true
            }]);

            if (empError) throw empError;

            // 2. Registrar empresa en tabla companies
            const { error: compError } = await rawSupabaseClient.from('companies').insert([{
                id: cleanId,
                name: cleanId.toUpperCase(),
                is_active: true,
                contract_accepted: false
            }]);

            if (compError) throw compError;

            // Generar URL
            const baseUrl = window.location.origin;
            const finalLink = `${baseUrl}/?company=${cleanId}`;
            setGeneratedLink(finalLink);

            // Recargar lista
            await loadSaaSData();

            // Limpiar formulario
            setNewCompanyId('');
            setNewAdminName('');
            setNewAdminPin('');

            alert('🎉 ¡Nueva empresa e inicio de sesión de Administrador registrados con éxito!');
        } catch (e) {
            console.error('Error creando empresa:', e);
            alert('Error al crear la empresa: ' + e.message);
        }
        setSaasLoading(false);
    };

    const toggleCompanyStatus = async (companyId, currentStatus) => {
        if (companyId === 'saas-admin') {
            alert('No se puede suspender el espacio de administración del desarrollador.');
            return;
        }
        const actionText = currentStatus ? 'suspender' : 'activar';
        if (!window.confirm(`¿Seguro que deseas ${actionText} la empresa "${companyId}"?`)) {
            return;
        }
        setSaasLoading(true);
        try {
            const { error } = await rawSupabaseClient
                .from('companies')
                .update({ is_active: !currentStatus })
                .eq('id', companyId);

            if (error) throw error;
            
            alert(`Empresa "${companyId}" ${currentStatus ? 'suspenda' : 'activada'} con éxito.`);
            await loadSaaSData();
        } catch (e) {
            console.error('Error al cambiar estado de empresa:', e);
            alert('Error al cambiar el estado: ' + e.message);
        }
        setSaasLoading(false);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('📋 ¡Enlace copiado al portapapeles!');
    };

    const filteredLogs = useMemo(() => {
        if (!searchTerm) return logs;
        const term = searchTerm.toLowerCase();
        return logs.filter(log => 
            (log.action || '').toLowerCase().includes(term) ||
            (log.employees?.name || '').toLowerCase().includes(term) ||
            JSON.stringify(log.details || {}).toLowerCase().includes(term)
        );
    }, [logs, searchTerm]);

    const getActionTheme = (action) => {
        const a = action.toLowerCase();
        if (a.includes('eliminar')) return { color: '#ff4d4d', icon: 'delete_forever' };
        if (a.includes('cierre')) return { color: '#38bdf8', icon: 'lock_person' };
        if (a.includes('venta') || a.includes('cobro') || a.includes('pago')) return { color: '#10b981', icon: 'payments' };
        if (a.includes('gomería')) return { color: '#f59e0b', icon: 'tire_repair' };
        if (a.includes('heartbeat')) return { color: '#cbd5e1', icon: 'monitor_heart' };
        if (a.includes('crear') || a.includes('nueva')) return { color: 'var(--primary)', icon: 'add_circle' };
        return { color: 'var(--text-main)', icon: 'info' };
    };

    const renderDetails = (details) => {
        if (!details) return null;
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(details).map(([key, value]) => {
                    if (key === 'status' && value === 'System Active & Online') return null;
                    
                    let valDisplay = value;
                    if (typeof value === 'object') valDisplay = JSON.stringify(value);
                    if (key === 'amount' || key === 'total') valDisplay = formatCurrency(value);
                    
                    return (
                        <div key={key} style={{ 
                            fontSize: 10, 
                            padding: '2px 8px', 
                            background: 'var(--bg-hover)', 
                            borderRadius: 12, 
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)'
                        }}>
                            <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>{key.replace('_', ' ')}:</strong> {String(valDisplay)}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="page-content">
            <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <SectionHeader icon="security" title="Consola de Administración y Auditoría" />
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-ghost" onClick={loadData} title="Refrescar">
                            <Icon name="refresh" />
                        </button>
                        {tab === 'logs' && (
                            <button className="btn btn-primary" onClick={() => exportToExcel('audit', filteredLogs)}>
                                <Icon name="download" /> Exportar logs (.xlsx)
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs Selectors */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                    <button 
                        className={`btn ${tab === 'logs' ? 'btn-primary' : 'btn-ghost'}`} 
                        onClick={() => setTab('logs')}
                        style={{ flex: 1 }}
                    >
                        <Icon name="history" /> Auditoría de Uso
                    </button>
                    <button 
                        className={`btn ${tab === 'heatmap' ? 'btn-primary' : 'btn-ghost'}`} 
                        onClick={() => setTab('heatmap')}
                        style={{ flex: 1 }}
                    >
                        <Icon name="local_fire_department" /> Interacciones
                    </button>
                    <button 
                        className={`btn ${tab === 'saas' ? 'btn-primary' : 'btn-ghost'}`} 
                        onClick={() => setTab('saas')}
                        style={{ flex: 1 }}
                    >
                        <Icon name="hub" /> Gestión SaaS (Talleres)
                    </button>
                </div>

                {loading && tab !== 'saas' ? (
                    <GlassCard style={{ padding: 40, textAlign: 'center' }}>
                        <Icon name="sync" className="spin" style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 12 }} />
                        <p>Cargando registros del servidor...</p>
                    </GlassCard>
                ) : (
                    <>
                        {/* Tab 1: Logs */}
                        {tab === 'logs' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        className="form-input" 
                                        placeholder="Buscar por usuario, acción o dato específico..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{ paddingLeft: 40 }}
                                    />
                                    <Icon name="search" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                </div>

                                <GlassCard>
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 160 }}>Fecha y Hora</th>
                                                    <th style={{ width: 180 }}>Usuario</th>
                                                    <th style={{ width: 220 }}>Acción</th>
                                                    <th>Detalles de la Operación</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredLogs.map(log => {
                                                    const theme = getActionTheme(log.action);
                                                    return (
                                                        <tr key={log.id} style={{ opacity: log.action === 'Heartbeat' ? 0.7 : 1 }}>
                                                            <td style={{ fontSize: 13 }}>
                                                                <div style={{ fontWeight: 600 }}>{new Date(log.created_at).toLocaleDateString('es-AR')}</div>
                                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleTimeString('es-AR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <div style={{ 
                                                                        width: 24, height: 24, borderRadius: '50%', 
                                                                        background: 'var(--primary)', display: 'flex', alignItems: 'center', 
                                                                        justifyContent: 'center', color: 'white', fontSize: 10 
                                                                    }}>
                                                                        {log.employees?.name?.charAt(0) || '?'}
                                                                    </div>
                                                                    {log.employees?.name || 'Sistema'}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.color }}>
                                                                    <Icon name={theme.icon} style={{ fontSize: 18 }} />
                                                                    <span style={{ fontWeight: 700 }}>{log.action}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                {renderDetails(log.details)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {filteredLogs.length === 0 && (
                                                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No se encontraron registros coincidentes.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        {/* Tab 2: Heatmap */}
                        {tab === 'heatmap' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
                                <GlassCard style={{ gridColumn: '1 / -1' }}>
                                    <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Icon name="analytics" style={{ color: 'var(--primary)' }} />
                                        Acciones más frecuentes de la plataforma
                                    </h3>
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Módulo / Pantalla</th>
                                                    <th>Botón o Acción</th>
                                                    <th style={{ width: '40%' }}>Intensidad de Uso</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {clicks.map((click, idx) => {
                                                    const maxCount = clicks[0]?.count || 1;
                                                    const percentage = (click.count / maxCount) * 100;
                                                    return (
                                                        <tr key={click.id}>
                                                            <td style={{ color: 'var(--text-muted)' }}>{click.page}</td>
                                                            <td style={{ fontWeight: 700 }}>{click.button_id}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                    <div style={{ flex: 1, height: 8, background: 'var(--bg-hover)', borderRadius: 4, overflow: 'hidden' }}>
                                                                        <div style={{ 
                                                                            height: '100%', 
                                                                            width: `${percentage}%`, 
                                                                            background: percentage > 70 ? 'var(--primary)' : 'var(--border-focus)', 
                                                                            transition: 'width 1s ease-out' 
                                                                        }} />
                                                                    </div>
                                                                    <StatusBadge text={String(click.count)} color={idx === 0 ? 'primary' : 'muted'} />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        {/* Tab 3: SaaS Management */}
                        {tab === 'saas' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
                                
                                {/* Form: Registrar Empresa */}
                                <GlassCard style={{ padding: 28, height: 'fit-content' }}>
                                    <SectionHeader icon="add_business" title="Registrar Nuevo Taller (SaaS)" />
                                    
                                    <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 16 }}>
                                        <div>
                                            <label className="form-label">Identificador Único del Taller</label>
                                            <input 
                                                className="form-input"
                                                placeholder="ej: gomerialujan (letras minúsculas)"
                                                value={newCompanyId}
                                                onChange={e => setNewCompanyId(e.target.value)}
                                                required
                                            />
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                Se usará en la URL: ?company=identificador
                                            </span>
                                        </div>

                                        <div>
                                            <label className="form-label">Nombre del Dueño / Administrador</label>
                                            <input 
                                                className="form-input"
                                                placeholder="ej: Juan Pérez"
                                                value={newAdminName}
                                                onChange={e => setNewAdminName(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="form-label">PIN de Acceso Inicial (4 dígitos)</label>
                                            <input 
                                                className="form-input"
                                                type="text"
                                                maxLength={4}
                                                placeholder="ej: 1234"
                                                value={newAdminPin}
                                                onChange={e => setNewAdminPin(e.target.value.replace(/\D/g, ''))}
                                                required
                                            />
                                        </div>

                                        <button 
                                            className="btn btn-primary" 
                                            type="submit" 
                                            disabled={saasLoading}
                                            style={{ width: '100%', justifyContent: 'center', height: 42, marginTop: 10 }}
                                        >
                                            {saasLoading ? <Icon name="sync" className="spin" /> : 'Registrar Empresa y Admin'}
                                        </button>
                                    </form>

                                    {/* Generated Link Alert Box */}
                                    {generatedLink && (
                                        <div style={{ 
                                            marginTop: 24, 
                                            padding: 16, 
                                            background: 'rgba(16, 185, 129, 0.1)', 
                                            border: '1px solid rgba(16, 185, 129, 0.3)', 
                                            borderRadius: 'var(--radius)' 
                                        }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                <Icon name="link" /> Enlace de Acceso Generado:
                                            </div>
                                            <div style={{ 
                                                fontSize: 11, 
                                                fontFamily: 'monospace', 
                                                background: 'rgba(0,0,0,0.2)', 
                                                padding: '8px 12px', 
                                                borderRadius: 6, 
                                                wordBreak: 'break-all',
                                                color: 'var(--text-main)',
                                                marginBottom: 12 
                                            }}>
                                                {generatedLink}
                                            </div>
                                            <button 
                                                className="btn btn-ghost" 
                                                onClick={() => copyToClipboard(generatedLink)}
                                                style={{ width: '100%', justifyContent: 'center', fontSize: 12, height: 32 }}
                                            >
                                                <Icon name="content_copy" size={14} /> Copiar Enlace
                                            </button>
                                        </div>
                                    )}
                                </GlassCard>

                                {/* List of Active Tenants */}
                                <GlassCard style={{ padding: 28 }}>
                                    <SectionHeader icon="store" title="Talleres Registrados" />
                                    
                                    {saasLoading && companyList.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                            <Icon name="sync" className="spin" /> Cargando listado...
                                        </div>
                                    ) : (
                                        <div className="table-responsive" style={{ marginTop: 16 }}>
                                            <table className="table" style={{ fontSize: 13 }}>
                                                <thead>
                                                    <tr>
                                                        <th>Identificador</th>
                                                        <th>Admin Principal</th>
                                                        <th>Estado</th>
                                                        <th>Contrato</th>
                                                        <th style={{ textAlign: 'center' }}>Empleados</th>
                                                        <th style={{ width: 120 }}>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {companyList.map(comp => (
                                                        <tr key={comp.id} style={{ height: 48 }}>
                                                            <td style={{ fontWeight: 700, color: comp.id === 'piripi' ? 'var(--primary)' : 'var(--text-main)' }}>
                                                                {comp.id} {comp.id === 'piripi' && '👑'}
                                                            </td>
                                                            <td>{comp.admin_name || 'Sin Admin'}</td>
                                                            <td>
                                                                <StatusBadge 
                                                                    text={comp.is_active ? 'Activo' : 'Suspendido'} 
                                                                    color={comp.is_active ? 'success' : 'danger'} 
                                                                />
                                                            </td>
                                                            <td>
                                                                {comp.contract_accepted ? (
                                                                    <span style={{ color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                                        <Icon name="check_circle" size={14} /> Firmado
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ color: '#f59e0b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                                        <Icon name="pending" size={14} /> Pendiente
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <StatusBadge text={String(comp.employees_count)} color="muted" />
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                                    <button 
                                                                        className={`btn ${comp.is_active ? 'btn-danger' : 'btn-success'}`}
                                                                        style={{ padding: '4px 10px', fontSize: '11px', height: '28px', minWidth: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        onClick={() => toggleCompanyStatus(comp.id, comp.is_active)}
                                                                        disabled={comp.id === 'saas-admin'}
                                                                    >
                                                                        {comp.is_active ? 'Suspender' : 'Activar'}
                                                                    </button>
                                                                    <button 
                                                                        className="btn btn-ghost" 
                                                                        onClick={() => copyToClipboard(`${window.location.origin}/?company=${comp.id}`)}
                                                                        title="Copiar Link"
                                                                        style={{ padding: 4, minWidth: 'auto', height: 28 }}
                                                                    >
                                                                        <Icon name="content_copy" size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {companyList.length === 0 && (
                                                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay empresas registradas.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </GlassCard>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
