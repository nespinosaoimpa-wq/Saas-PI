import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Icon, Modal, FormField } from '../components/ui';

export function LoginPage() {
    const { employees, login, loading } = useAuth();
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const { addTimeLog } = useApp();
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [timePin, setTimePin] = useState('');

    const handleEmployeeClick = (emp) => {
        setSelectedEmployee(emp);
        setPin('');
        setError('');
    };

    const handlePinChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
        setPin(value);
        if (value.length === 4) {
            const success = login(selectedEmployee.id, value);
            if (!success) {
                setError('PIN incorrecto');
                setPin('');
            }
        }
    };

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando sistema...</div>;
    }

    if (!selectedEmployee) {
        return (
            <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000000', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 20, right: 20, color: 'white', opacity: 0.5, fontSize: 12 }}>v3.0.0</div>

                {/* Floating Fichar Button */}
                <button
                    onClick={() => setShowTimeModal(true)}
                    style={{
                        position: 'absolute', top: 20, left: 20,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                    <Icon name="schedule" size={18} /> Fichar Ingreso/Salida
                </button>

                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ display: 'inline-flex', padding: 24, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: '24px', color: 'white', marginBottom: 24, boxShadow: '0 10px 30px rgba(var(--primary-rgb), 0.3)' }}>
                        <Icon name="precision_manufacturing" size={56} />
                    </div>
                    <h1 style={{ fontSize: 32, letterSpacing: -1 }}>PIRIPI <strong style={{ color: 'var(--primary)' }}>PRO</strong></h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Bienvenido al Sistema de Gestión</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, width: '100%', maxWidth: 700, padding: 20 }}>
                    {employees.map(emp => (
                        <button key={emp.id} className="card" style={{ padding: 20, textAlign: 'center', cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s', background: 'rgba(255,255,255,0.03)', borderRadius: 16 }} onClick={() => handleEmployeeClick(emp)}>
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                                <Icon name="person" size={28} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: 14 }}>{emp.name}</h3>
                            <span style={{ fontSize: 10, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {emp.role}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Modal Fichaje (Copy from App.jsx logic) */}
                {showTimeModal && (
                    <Modal title="Fichaje de Personal" onClose={() => { setShowTimeModal(false); setTimePin(''); }} footer={
                        <React.Fragment>
                            <button className="btn btn-ghost" onClick={() => { setShowTimeModal(false); setTimePin(''); }}>Cancelar</button>
                        </React.Fragment>
                    }>
                        <div style={{ padding: '0 10px', textAlign: 'center' }}>
                            <Icon name="alarm_on" size={56} style={{ color: 'var(--primary)', marginBottom: 16 }} />
                            <h3 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Reloj de Asistencia</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Ingresá tu PIN para registrar tu entrada o salida.</p>

                            <div style={{ maxWidth: 300, margin: '0 auto' }}>
                                <FormField label="PIN de Acceso">
                                    <input
                                        type="password"
                                        className="form-input"
                                        maxLength={4}
                                        style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, padding: 16 }}
                                        value={timePin}
                                        onChange={e => setTimePin(e.target.value.replace(/\D/g, ''))}
                                        autoFocus
                                    />
                                </FormField>
                                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                    <button className="btn btn-success" style={{ flex: 1, padding: '16px 0', fontSize: 14, fontWeight: 700 }} onClick={() => {
                                        if (timePin.length < 4) return alert('El PIN debe tener 4 dígitos');
                                        try {
                                            const res = addTimeLog(timePin, 'IN');
                                            alert(`✅ ¡ENTRADA REGISTRADA!\nEmpleado: ${res.emp.name}`);
                                            setShowTimeModal(false);
                                            setTimePin('');
                                        } catch (e) { alert(e.message); }
                                    }}>ENTRADA</button>
                                    <button className="btn btn-danger" style={{ flex: 1, padding: '16px 0', fontSize: 14, fontWeight: 700 }} onClick={() => {
                                        if (timePin.length < 4) return alert('El PIN debe tener 4 dígitos');
                                        try {
                                            const res = addTimeLog(timePin, 'OUT');
                                            alert(`👋 ¡SALIDA REGISTRADA!\nEmpleado: ${res.emp.name}`);
                                            setShowTimeModal(false);
                                            setTimePin('');
                                        } catch (e) { alert(e.message); }
                                    }}>SALIDA</button>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }

    return (
        <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000000' }}>
            <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32, textAlign: 'center', position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 24 }}>
                <button className="btn-icon" style={{ position: 'absolute', top: 16, left: 16 }} onClick={() => setSelectedEmployee(null)}>
                    <Icon name="arrow_back" />
                </button>

                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                    <Icon name="person" size={40} style={{ color: 'var(--primary)' }} />
                </div>
                <h2 style={{ margin: '0 0 8px 0' }}>Hola, {selectedEmployee.name}</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Ingresa tu PIN de 4 dígitos</p>

                <div style={{ position: 'relative', width: 240, margin: '0 auto 24px auto' }}>
                    <input
                        type="password"
                        value={pin}
                        onChange={handlePinChange}
                        autoFocus
                        style={{
                            width: '100%',
                            fontSize: 32,
                            letterSpacing: 16,
                            textAlign: 'center',
                            padding: 16,
                            borderRadius: 'var(--radius)',
                            border: `2px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
                            background: 'var(--bg-hover)',
                            outline: 'none',
                            color: 'var(--text-primary)'
                        }}
                        placeholder="••••"
                        maxLength={4}
                    />
                    {error && <p style={{ color: 'var(--danger)', fontSize: 14, marginTop: 8 }}>{error}</p>}
                </div>
            </div>
        </div>
    );
}
