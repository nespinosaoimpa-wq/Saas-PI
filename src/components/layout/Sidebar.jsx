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
            <div className="sidebar-brand" onClick={handleLogoClick} style={{ cursor: 'default', userSelect: 'none' }}>
                <div className="sidebar-brand-icon">
                    <Icon name="precision_manufacturing" />
                </div>
                <h1>PIRIPI <strong>SANTA FE</strong></h1>
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
