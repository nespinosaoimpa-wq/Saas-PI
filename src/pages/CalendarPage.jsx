import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { SectionHeader, GlassCard, StatusBadge, Icon, Modal, FormRow, FormField } from '../components/ui';

export const CalendarPage = () => {
    const { data: MOCK, refreshData, exportToExcel } = useApp();
    const appointments = MOCK.appointments || [];

    // Dynamic date
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        title: '', client: '', vehicle: '', date: '', time: '09:00', box: 'Box 1', color: '#3b82f6', notes: ''
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const todayStr = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }, []);

    const selectedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const isToday = (d) => {
        const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return s === todayStr;
    };

    const hasEvent = (d) => {
        const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return appointments.some(a => a.date === s);
    };

    const selectedAppointments = appointments.filter(a => a.date === selectedDateStr);
    const upcomingAppointments = appointments.filter(a => a.date > selectedDateStr).slice(0, 5);

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const openNewAppointment = () => {
        setForm({
            title: '', client: '', vehicle: '', date: selectedDateStr,
            time: '09:00', box: 'Box 1', color: '#3b82f6', notes: ''
        });
        setShowModal(true);
    };

    const handleSaveAppointment = async () => {
        if (!form.title || !form.date || !form.time) return alert('Título, fecha y hora son obligatorios');
        setLoading(true);
        try {
            const payload = {
                title: form.title,
                client: form.client,
                vehicle: form.vehicle,
                date: form.date,
                time: form.time,
                box: form.box,
                color: form.color,
                notes: form.notes,
                status: 'Pendiente'
            };
            const { error } = await supabase.from('appointments').insert([payload]);
            if (error) throw error;
            await refreshData();
            setShowModal(false);
        } catch (e) {
            console.error(e);
            alert('Error al guardar turno: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAppointment = async (id) => {
        if (!window.confirm('¿Eliminar este turno?')) return;
        try {
            await supabase.from('appointments').delete().eq('id', id);
            await refreshData();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="page-content">
            <div className="page-grid grid-sidebar-narrow">
                <div>
                    <SectionHeader icon="calendar_month" title={`${monthNames[month]} ${year}`} right={
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button className="btn btn-ghost btn-sm" onClick={prevMonth}><Icon name="chevron_left" size={20} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={nextMonth}><Icon name="chevron_right" size={20} /></button>
                            <button className="btn btn-ghost btn-sm" onClick={() => exportToExcel('appointments')} title="Exportar Turnos a Excel"><Icon name="download" size={20} /></button>
                            <button className="btn btn-primary btn-sm" onClick={openNewAppointment}><Icon name="add" size={16} /> Nuevo Turno</button>
                        </div>
                    } />
                    <GlassCard style={{ padding: 20 }}>
                        <div className="calendar-grid">
                            {days.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
                            {cells.map((d, i) => (
                                <div key={i}
                                    className={`calendar-cell ${d && isToday(d) ? 'today' : ''} ${d && hasEvent(d) ? 'has-event' : ''} ${d === selectedDay ? 'selected' : ''}`}
                                    onClick={() => d && setSelectedDay(d)}
                                    style={{ cursor: d ? 'pointer' : 'default' }}>
                                    {d && <span style={{ fontSize: 12, fontWeight: isToday(d) ? 700 : 400, color: isToday(d) ? 'var(--primary)' : d === selectedDay ? 'var(--accent)' : 'var(--text-secondary)' }}>{d}</span>}
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div>
                    <SectionHeader icon="event" title={`Turnos — ${selectedDay}/${month + 1}/${year}`} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {selectedAppointments.length === 0 && (
                            <GlassCard style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>
                                <Icon name="event_busy" size={36} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hay turnos para este día</div>
                                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openNewAppointment}>
                                    <Icon name="add" size={16} /> Agendar Turno
                                </button>
                            </GlassCard>
                        )}
                        {selectedAppointments.map(apt => (
                            <GlassCard key={apt.id} style={{ padding: 16, borderLeft: `3px solid ${apt.color || 'var(--primary)'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{apt.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{apt.client} • {apt.vehicle}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                        <StatusBadge status={apt.status || 'Pendiente'} />
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteAppointment(apt.id)} style={{ color: 'var(--danger)', padding: 4 }}>
                                            <Icon name="delete" size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                                    <span><Icon name="schedule" size={14} /> {apt.time}</span>
                                    <span><Icon name="garage" size={14} /> {apt.box}</span>
                                </div>
                                {apt.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>{apt.notes}</div>}
                            </GlassCard>
                        ))}
                    </div>

                    {upcomingAppointments.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <SectionHeader icon="upcoming" title="Próximos Días" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {upcomingAppointments.map(apt => (
                                    <GlassCard key={apt.id} style={{ padding: 14, opacity: 0.7 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{apt.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {apt.date} {apt.time} • {apt.client}
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <Modal title="Nuevo Turno" onClose={() => setShowModal(false)} width="550px"
                    footer={<>
                        <button className="btn btn-ghost" disabled={loading} onClick={() => setShowModal(false)}>Cancelar</button>
                        <button className="btn btn-primary" disabled={loading} onClick={handleSaveAppointment}>{loading ? 'Guardando...' : 'Agendar Turno'}</button>
                    </>}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <FormField label="Título / Motivo *">
                            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Cambio de Aceite" />
                        </FormField>
                        <FormRow>
                            <FormField label="Cliente">
                                <input className="form-input" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Nombre del cliente" />
                            </FormField>
                            <FormField label="Vehículo">
                                <input className="form-input" value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} placeholder="Ej: Honda CRV 2020" />
                            </FormField>
                        </FormRow>
                        <FormRow>
                            <FormField label="Fecha *">
                                <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            </FormField>
                            <FormField label="Hora *">
                                <input type="time" className="form-input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                            </FormField>
                        </FormRow>
                        <FormRow>
                            <FormField label="Box">
                                <select className="form-select" value={form.box} onChange={e => setForm({ ...form, box: e.target.value })}>
                                    {(MOCK.boxes || []).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                    {(!MOCK.boxes || MOCK.boxes.length === 0) && <>
                                        <option value="Box 1">Box 1</option>
                                        <option value="Box 2">Box 2</option>
                                        <option value="Box 3">Box 3</option>
                                    </>}
                                </select>
                            </FormField>
                            <FormField label="Color">
                                <input type="color" className="form-input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ height: 42, padding: 4 }} />
                            </FormField>
                        </FormRow>
                        <FormField label="Notas adicionales">
                            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observaciones..." />
                        </FormField>
                    </div>
                </Modal>
            )}
        </div>
    );
};
