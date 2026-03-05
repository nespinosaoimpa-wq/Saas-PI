import React from 'react';
import { useApp } from '../context/AppContext';
import { MOCK as STATIC_MOCK } from '../data/data';
import { SectionHeader, GlassCard, StatusBadge, Icon } from '../components/ui';

export const CalendarPage = () => {
    const { data: MOCK } = useApp();
    const appointments = MOCK.appointments || STATIC_MOCK.appointments || [];

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = 27;
    const daysInMonth = 28;
    const firstDayOfWeek = 6;

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr 340px' }}>
                <div>
                    <SectionHeader icon="calendar_month" title="Febrero 2026" right={
                        <button className="btn btn-primary btn-sm"><Icon name="add" size={16} /> Nuevo Turno</button>
                    } />
                    <GlassCard style={{ padding: 20 }}>
                        <div className="calendar-grid">
                            {days.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
                            {cells.map((d, i) => (
                                <div key={i} className={`calendar-cell ${d === today ? 'today' : ''} ${d && appointments.some(a => a.date === `2026-02-${String(d).padStart(2, '0')}`) ? 'has-event' : ''}`}>
                                    {d && <span style={{ fontSize: 12, fontWeight: d === today ? 700 : 400, color: d === today ? 'var(--primary)' : 'var(--text-secondary)' }}>{d}</span>}
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div>
                    <SectionHeader icon="event" title="Turnos del Día" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {appointments.filter(a => a.date === '2026-02-27').map(apt => (
                            <GlassCard key={apt.id} style={{ padding: 16, borderLeft: `3px solid ${apt.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{apt.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{apt.client} • {apt.vehicle}</div>
                                    </div>
                                    <StatusBadge status={apt.status} />
                                </div>
                                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                                    <span><Icon name="schedule" size={14} /> {apt.time}</span>
                                    <span><Icon name="garage" size={14} /> {apt.box}</span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                    <div style={{ marginTop: 20 }}>
                        <SectionHeader icon="upcoming" title="Próximos Días" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {appointments.filter(a => a.date > '2026-02-27').map(apt => (
                                <GlassCard key={apt.id} style={{ padding: 14, opacity: 0.7 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{apt.title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {apt.date} {apt.time} • {apt.client}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
