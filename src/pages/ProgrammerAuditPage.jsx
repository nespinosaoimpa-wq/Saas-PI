import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Icon } from '../components/ui';

export function ProgrammerAuditPage() {
    const [logs, setLogs] = useState([]);
    const [clicks, setClicks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('logs');

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

    return (
        <div className="page-container">
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
                <button 
                    className={`btn ${tab === 'logs' ? 'btn-primary' : 'btn-ghost'}`} 
                    onClick={() => setTab('logs')}
                >
                    <Icon name="list_alt" /> Registro de Movimientos
                </button>
                <button 
                    className={`btn ${tab === 'heatmap' ? 'btn-primary' : 'btn-ghost'}`} 
                    onClick={() => setTab('heatmap')}
                >
                    <Icon name="local_fire_department" /> Mapa de Calor (Uso)
                </button>
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: 'center' }}>Cargando datos de auditoría...</div>
            ) : (
                <>
                    {tab === 'logs' && (
                        <div className="card">
                            <h3 style={{ marginBottom: 16 }}>Últimos 200 Movimientos</h3>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Fecha y Hora</th>
                                            <th>Usuario</th>
                                            <th>Acción</th>
                                            <th>Detalles</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map(log => (
                                            <tr key={log.id}>
                                                <td>{new Date(log.created_at).toLocaleString('es-AR')}</td>
                                                <td>{log.employees?.name || 'Desconocido'}</td>
                                                <td style={{ fontWeight: 'bold' }}>{log.action}</td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                    {log.details ? JSON.stringify(log.details) : ''}
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.length === 0 && (
                                            <tr><td colSpan={4} style={{ textAlign: 'center' }}>No hay registros.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {tab === 'heatmap' && (
                        <div className="card">
                            <h3 style={{ marginBottom: 16 }}>Botones más clickeados Globalmente</h3>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Página / Componente</th>
                                            <th>ID Botón / Acción</th>
                                            <th>Cantidad de Clicks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clicks.map(click => (
                                            <tr key={click.id}>
                                                <td>{click.page}</td>
                                                <td style={{ fontWeight: 'bold' }}>{click.button_id}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ 
                                                            height: 8, 
                                                            width: Math.min(100, (click.count / clicks[0]?.count) * 100) + 'px', 
                                                            background: 'var(--primary)', 
                                                            borderRadius: 4 
                                                        }} />
                                                        {click.count}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {clicks.length === 0 && (
                                            <tr><td colSpan={3} style={{ textAlign: 'center' }}>No hay estadísticas de botones aún.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
