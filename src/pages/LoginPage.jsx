import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/ui';
import { supabase } from '../lib/supabase';

export function LoginPage() {
    const { employees, login, loading } = useAuth();
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

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
            <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{ display: 'inline-flex', padding: 20, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 'var(--radius)', color: 'white', marginBottom: 20 }}>
                        <Icon name="precision_manufacturing" size={48} />
                    </div>
                    <h1>PIRIPI <strong>PRO</strong></h1>
                    <p style={{ color: 'var(--text-muted)' }}>Selecciona tu usuario para ingresar</p>
                    {/* Debug Info */}
                    <div style={{ marginTop: 20, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
                        Connected: {employees.length > 0 ? 'YES' : 'NO'} | Loading: {loading ? 'YES' : 'NO'} | Supabase: {supabase ? 'INIT' : 'FAIL'}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20, width: '100%', maxWidth: 800, padding: 20 }}>
                    {employees.map(emp => (
                        <button key={emp.id} className="card" style={{ padding: 24, textAlign: 'center', cursor: 'pointer', border: '2px solid transparent', transition: 'all 0.2s', background: 'var(--surface)' }} onClick={() => handleEmployeeClick(emp)}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                                <Icon name="person" size={32} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{emp.name}</h3>
                            <span className={`badge ${emp.role === 'admin' ? 'badge-active' : 'badge-done'}`} style={{ fontSize: 11 }}>
                                {emp.role.toUpperCase()}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
            <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32, textAlign: 'center', position: 'relative' }}>
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
