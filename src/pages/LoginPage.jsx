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
            <div className="app-layout" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, #111827 0%, #000000 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Background Elements */}
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(var(--primary-rgb), 0.05)', filter: 'blur(100px)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'rgba(var(--accent-rgb), 0.05)', filter: 'blur(100px)', borderRadius: '50%' }} />

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

                <div style={{ textAlign: 'center', marginBottom: 64, zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '12px',
                        background: '#ffffff',
                        borderRadius: '50%',
                        marginBottom: 32,
                        boxShadow: '0 0 40px rgba(var(--primary-rgb), 0.2), 0 20px 50px rgba(0,0,0,0.5)',
                        border: '4px solid rgba(255,255,255,0.05)',
                        overflow: 'hidden',
                        width: 160,
                        height: 160,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <img src="/logo-piripi.png" alt="Piripi Logo" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                    </div>
                    <h1 style={{ fontSize: 42, letterSpacing: -2, color: '#ffffff', fontWeight: 900, marginBottom: 8 }}>PIRIPI <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PRO</span></h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 500, letterSpacing: 0.5 }}>Sistema de Gestión de Mecánica & Lubricentro</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24, width: '100%', maxWidth: 840, padding: 20, zIndex: 1 }}>
                    {employees.map(emp => (
                        <button key={emp.id} className="card" style={{
                            padding: '32px 24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.08)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 24,
                            backdropFilter: 'blur(12px)',
                            color: '#ffffff',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        }}
                            onClick={() => handleEmployeeClick(emp)}
                            onMouseOver={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                                e.currentTarget.style.borderColor = 'rgba(var(--primary-rgb), 0.4)';
                                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
                            }}
                        >
                            <div style={{
                                width: 72,
                                height: 72,
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.15), rgba(var(--accent-rgb), 0.15))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px auto',
                                border: '1px solid rgba(var(--primary-rgb), 0.2)'
                            }}>
                                <Icon name="person" size={36} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 style={{ margin: '0 0 6px 0', fontSize: 17, fontWeight: 800, color: '#ffffff', letterSpacing: -0.3 }}>{emp.name}</h3>
                            <div style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: 'var(--primary)',
                                textTransform: 'uppercase',
                                letterSpacing: 1.5,
                                background: 'rgba(var(--primary-rgb), 0.1)',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                display: 'inline-block'
                            }}>
                                {emp.role}
                            </div>
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
