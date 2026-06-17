import React, { useState } from 'react';
import { Icon } from '../ui';
import { useAuth } from '../../context/AuthContext';

export function Sidebar({ 
    navItems, 
    currentPage, 
    onNavigate, 
    sidebarOpen, 
    setSidebarOpen 
}) {
    const { user, logout } = useAuth();
    const [logoClicks, setLogoClicks] = useState(0);

    const handleLogoClick = () => {
        const newCount = logoClicks + 1;
        setLogoClicks(newCount);
        if (newCount >= 7) {
            // Esta lógica del modo programador se maneja en useNavigation vía el evento de teclas,
            // pero para el click en logo necesitamos disparar la alerta o el cambio.
            // Para mantenerlo simple, delegamos el estado al hook pero el click aquí.
            window.dispatchEvent(new KeyboardEvent('keydown', {
                ctrlKey: true,
                altKey: true,
                key: 'a'
            }));
            setLogoClicks(0);
        }
    };

    return (
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-brand" onClick={handleLogoClick} style={{ cursor: 'default', userSelect: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="sidebar-brand-icon" style={{
                    background: 'linear-gradient(135deg, #74acdf, #ffffff, #74acdf)',
                    boxShadow: '0 4px 12px rgba(116, 172, 223, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <Icon name="sports_soccer" style={{ color: '#0c1222' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '2px', color: '#f1c40f', marginBottom: '2px', lineHeight: 1 }}>
                        <span className="material-symbols-outlined mundial-star" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined mundial-star" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span className="material-symbols-outlined mundial-star" style={{ fontSize: '13px', fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                    <h1 style={{ fontSize: '16px', margin: 0 }}>PIRIPI <strong style={{ background: 'linear-gradient(135deg, #74acdf, #f1c40f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>SANTA FE</strong></h1>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item, i) => {
                    if (item.section) {
                        return <div key={i} className="nav-section-title">{item.section}</div>;
                    }
                    return (
                        <div
                            key={item.key}
                            className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
                            onClick={() => onNavigate(item.key)}
                        >
                            <Icon name={item.icon} />
                            <span>{item.label}</span>
                            {item.badge && <span className="nav-badge">{item.badge}</span>}
                            {item.badgeAlert && <span className="nav-badge alert">{item.badgeAlert}</span>}
                        </div>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <div className="user-profile-mini">
                    <div className="user-avatar">
                        <Icon name="person" size={18} />
                    </div>
                    <div className="user-info">
                        <div className="user-name">{user.name}</div>
                        <div className="user-meta">
                            <span>{user.role.toUpperCase()} • v3.0.0</span>
                            <button onClick={logout} className="logout-btn">Salir</button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
