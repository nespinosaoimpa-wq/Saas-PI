import React from 'react';
import { Icon } from '../ui';

export function Header({ 
    pageInfo, 
    isOnline, 
    isSyncing,
    onMenuClick, 
    showTimeModal, 
    showCameraScanner, 
    onNewWorkOrder,
    showNewWOButton
}) {
    return (
        <header className="header">
            <div className="header-left">
                <button
                    className="btn-icon mobile-menu"
                    onClick={onMenuClick}
                    style={{ display: 'none' }}
                >
                    <Icon name="menu" size={22} />
                </button>
                <div className="header-title">
                    <h2>{pageInfo.title}</h2>
                    <p>{pageInfo.sub}</p>
                </div>
                <div className="header-divider" />
                <div className="header-live">
                    <div className="live-dot" style={{ background: isOnline ? 'var(--success)' : 'var(--danger)' }} />
                    {isOnline ? 'Online' : 'Offline'}
                </div>
                {isSyncing && (
                    <div className="sync-badge">
                        <Icon name="sync" />
                        Sincronizando...
                    </div>
                )}
            </div>
            <div className="header-actions">
                <button className="notif-btn">
                    <Icon name="notifications" size={20} />
                    <span className="notif-dot" />
                </button>
                <button className="header-btn" onClick={showTimeModal}>
                    <Icon name="schedule" size={16} />
                    Fichar Ingreso/Salida
                </button>
                <button className="header-btn" onClick={showCameraScanner}>
                    <Icon name="photo_camera" size={16} />
                    Cámara (Móvil)
                </button>
                <button className="header-btn" onClick={() => alert('Esperando código del lector láser USB/Bluetooth...')}>
                    <Icon name="qr_code_scanner" size={16} />
                    Lector Láser
                </button>
                {showNewWOButton && (
                    <button className="header-btn primary" onClick={onNewWorkOrder}>
                        <Icon name="add_circle" size={16} />
                        <span>Nueva OT</span>
                    </button>
                )}
            </div>
        </header>
    );
}
