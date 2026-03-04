import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Icon, HealthRing } from '../components/ui';

export const PublicVehiclePage = ({ vehicleId }) => {
    const [vehicle, setVehicle] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPublicData = async () => {
            if (!supabase) return;
            setLoading(true);
            try {
                // Fetch vehicle and client info manually
                const { data: vData } = await supabase.from('vehicles').select('*, clients(*)').eq('id', vehicleId).single();
                if (vData) {
                    setVehicle(vData);
                    // Fetch works orders that finished
                    const { data: wData } = await supabase.from('work_orders').select('*').eq('vehicle_id', vehicleId).in('status', ['Finalizado', 'Cobrado']).order('created_at', { ascending: false });
                    setHistory(wData || []);
                }
            } catch (e) {
                console.error('Error fetching public vehicle data:', e);
            }
            setLoading(false);
        };
        fetchPublicData();
    }, [vehicleId]);

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            Cargando historial clínico...
        </div>
    );

    if (!vehicle) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
            <Icon name="error_outline" size={48} style={{ marginBottom: 16 }} />
            <p>Vehículo no encontrado o código QR inválido.</p>
        </div>
    );

    const clientName = vehicle.clients ? `${vehicle.clients.first_name} ${vehicle.clients.last_name}` : 'Propietario';

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', padding: 20, fontFamily: 'var(--font-family)', maxWidth: 600, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white' }}>
                    <Icon name="directions_car" size={24} />
                </div>
                <h1 style={{ fontSize: 24, margin: '0 0 4px 0', fontWeight: 800 }}>{vehicle.brand} {vehicle.model}</h1>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>{vehicle.license_plate} • Prop: {clientName}</p>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                <div style={{ flex: 1, background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                    <HealthRing score={vehicle.health_score || 85} size={60} />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Salud General</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="speed" size={32} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{vehicle.km?.toLocaleString() || 0}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kilómetros</div>
                </div>
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <Icon name="history" size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary)' }} />
                Historial de Servicios
            </h2>

            {history.length > 0 ? (
                <div className="timeline" style={{ paddingLeft: 12 }}>
                    {history.map(wo => (
                        <div key={wo.id} className="timeline-item" style={{ borderLeftWidth: 2, paddingLeft: 20, marginBottom: 20, position: 'relative' }}>
                            <div style={{
                                position: 'absolute', left: -7, top: 4, width: 12, height: 12,
                                background: 'var(--primary)', borderRadius: '50%',
                                outline: '4px solid var(--bg-base)'
                            }} />

                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                                {new Date(wo.created_at).toLocaleDateString()}
                            </div>

                            <div style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', padding: 16, borderRadius: 'var(--radius-sm)' }}>
                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                                    {wo.description || 'Mantenimiento General'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                                    <Icon name="speed" size={14} style={{ marginRight: 4 }} />
                                    {wo.km_at_entry ? wo.km_at_entry.toLocaleString() + ' km' : 'Sin registrar'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'var(--bg-hover)', borderRadius: 'var(--radius)' }}>
                    <Icon name="history_toggle_off" size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p style={{ fontSize: 14, margin: 0 }}>Aún no hay servicios finalizados registrados.</p>
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 40, padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>
                <p>Generado por <strong>PIRIPI PRO</strong> - Historial Clínico Digital</p>
            </div>
        </div>
    );
};
