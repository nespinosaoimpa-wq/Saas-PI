import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
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
                    if (key === 'status' && value === 'System Active & Online') return null; // Ignorar heartbeat spam
                    
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
                <SectionHeader icon="security" title="Gestión de Auditoría" />
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

            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <button 
                    className={`btn ${tab === 'logs' ? 'btn-primary' : 'btn-ghost'}`} 
                    onClick={() => setTab('logs')}
                    style={{ flex: 1 }}
                >
                    <Icon name="history" /> Registro de Movimientos
                </button>
                <button 
                    className={`btn ${tab === 'heatmap' ? 'btn-primary' : 'btn-ghost'}`} 
                    onClick={() => setTab('heatmap')}
                    style={{ flex: 1 }}
                >
                    <Icon name="local_fire_department" /> Mapa de Calor (Interacciones)
                </button>
            </div>

            {loading ? (
                <GlassCard style={{ padding: 40, textAlign: 'center' }}>
                    <Icon name="sync" className="spin" style={{ fontSize: 32, color: 'var(--primary)', marginBottom: 12 }} />
                    <p>Cargando registros del servidor...</p>
                </GlassCard>
            ) : (
                <>
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
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleTimeString('es-AR')}</div>
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
                </>
            )}
            </div>
        </div>
    );
}

