import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from './context/AppContext';

import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Icon, Modal, FormField, CameraScanner } from './components/ui';
import { useBarcodeScanner } from './hooks/useBarcodeScanner';
import { formatCurrency } from './data/data';
import { DashboardPage } from './pages/DashboardPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { DailyWorkPage } from './pages/DailyWorkPage';
import { ClientsPage } from './pages/ClientsPage';
import { InventoryPage } from './pages/InventoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CashRegisterPage } from './pages/CashRegisterPage';
import { CalendarPage } from './pages/CalendarPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SalesPage } from './pages/SalesPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { ProgrammerAuditPage } from './pages/ProgrammerAuditPage';

const PAGE_TITLES = {
    dashboard: { title: 'Dashboard', sub: 'Panel de Control Principal' },
    work_orders: { title: 'Órdenes de Trabajo', sub: 'Gestión de OTs y Circuito de Trabajo' },
    daily_work: { title: 'Trabajos del Día', sub: 'Vista del Mecánico' },
    clients: { title: 'Clientes & Vehículos', sub: 'Fichas de Clientes y Patentes' },
    inventory: { title: 'Inventario & Stock', sub: 'Control de Mercadería y Niveles' },
    suppliers: { title: 'Proveedores', sub: 'Gestión de Proveedores de Insumos' },
    sales: { title: 'Punto de Venta', sub: 'Ventas Rápidas con Escáner y Carrito' },
    cash: { title: 'Caja del Día', sub: 'Balance Efectivo, Transferencia y Tarjeta' },
    calendar: { title: 'Calendario de Turnos', sub: 'Agenda y Citas Programadas' },
    promotions: { title: 'Promociones', sub: 'Gestión de Ofertas y Descuentos' },
    reports: { title: 'Reportes & Estadísticas', sub: 'Análisis de Rentabilidad y Rendimiento' },
    users: { title: 'Gestión de Personal', sub: 'Control de Usuarios, Roles y Permisos' },
    settings: { title: 'Configuración', sub: 'Ajustes del Sistema y Facturación AFIP' },
    audit: { title: 'Auditoría del Sistema', sub: 'Registro de Actividad y Uso de la Plataforma' },
};

const PAGES = {
    dashboard: DashboardPage,
    work_orders: WorkOrdersPage,
    daily_work: DailyWorkPage,
    clients: ClientsPage,
    inventory: InventoryPage,
    suppliers: SuppliersPage,
    sales: SalesPage,
    cash: CashRegisterPage,
    calendar: CalendarPage,
    promotions: PromotionsPage,
    reports: ReportsPage,
    users: UsersPage,
    settings: AdminSettingsPage,
    audit: ProgrammerAuditPage,
};

function App() {
    const { data: MOCK, getLowStockItems } = useApp();
    const { user, logout } = useAuth();
    const [page, setPage] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Modo programador persistente
    const [showAuditAdmin, setShowAuditAdmin] = useState(() => localStorage.getItem('piripi_dev_mode') === 'true');
    const [logoClicks, setLogoClicks] = useState(0);
    const [scannedItem, setScannedItem] = useState(null);
    const [scannedQuantity, setScannedQuantity] = useState(1);
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [scannedUnknownCode, setScannedUnknownCode] = useState(null);

    const { addTimeLog } = useApp();
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [timePin, setTimePin] = useState('');

    // Escucha de teclado para acceso secreto (Ctrl + Alt + A)
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
                const newState = !showAuditAdmin;
                setShowAuditAdmin(newState);
                localStorage.setItem('piripi_dev_mode', newState);
                alert(`Modo Programador ${newState ? 'ACTIVADO' : 'DESACTIVADO'}`);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showAuditAdmin]);

    const handleLogoClick = () => {
        const newCount = logoClicks + 1;
        setLogoClicks(newCount);
        if (newCount >= 7) {
            const newState = !showAuditAdmin;
            setShowAuditAdmin(newState);
            localStorage.setItem('piripi_dev_mode', newState);
            alert(`🔓 Acceso de Programador ${newState ? 'Habilitado' : 'Deshabilitado'}`);
            setLogoClicks(0);
        }
    };

    // --- TRACKING GLOBAL DEL MAPA DE CALOR ---
    React.useEffect(() => {
        const handleClick = async (e) => {
            if (!user) return;
            const target = e.target.closest('button, a, [role="button"], .nav-item, .card');
            if (target) {
                // Generar un ID descriptivo para el botón:
                let btnId = target.id || target.getAttribute('aria-label') || target.textContent?.trim()?.substring(0, 30) || target.className || 'Botón Desconocido';
                if (!btnId || btnId.trim() === '') return;
                
                try {
                    // Buscar si ya existe el log para esta pagina y boton
                    const loc = window.location.pathname;
                    const { data } = await supabase.from('button_clicks').select('id, count').eq('button_id', btnId).eq('page', loc).single();
                    
                    if (data) {
                        await supabase.from('button_clicks').update({ count: data.count + 1 }).eq('id', data.id);
                    } else {
                        await supabase.from('button_clicks').insert([{
                            button_id: btnId,
                            page: loc,
                            employee_id: user.id,
                            count: 1
                        }]);
                    }
                } catch (err) {
                    console.log('Ignorando error de métricas (tracking)', err.message);
                }
            }
        };

        // Usa capture flag para agarrar clicks incluso si hay `stopPropagation()` en los componentes React
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [user]);

    // Manejador común para cuando un código es escaneado (ya sea por teclado o por cámara)
    const handleBarcodeScan = (code) => {
        if (!user) return; // No procesar si no hay usuario logueado
        const item = (MOCK.inventory || []).find(i =>
            (i.barcode && i.barcode === code) ||
            (i.name && i.name.toLowerCase().includes(code.toLowerCase()))
        );

        if (item) {
            setScannedItem(item);
            setScannedQuantity(1);
            setShowCameraScanner(false);
            setScannedUnknownCode(null);
        } else {
            console.warn('Código no encontrado:', code);
            if (window.confirm(`Código ${code} no encontrado en el inventario. ¿Deseas agregarlo como nuevo producto?`)) {
                setScannedUnknownCode(code);
                setPage('inventory');
                setSidebarOpen(false);
            }
            setShowCameraScanner(false);
        }
    };

    // Escucha global de código de barras físico (lector USB/Bluetooth)
    // IMPORTANTE: Este hook DEBE estar antes de cualquier return condicional
    useBarcodeScanner(handleBarcodeScan);

    // Si no hay usuario autenticado, mostrar pantalla de PIN
    if (!user) {
        return <LoginPage />;
    }

    const pageInfo = PAGE_TITLES[page] || PAGE_TITLES.dashboard;

    // Ensure mechanics/gomeros don't land on Dashboard if they shouldn't
    const effectivePage = (page === 'dashboard' && !['admin', 'cajero'].includes(user.role)) ? (user.role === 'limpieza' ? 'dashboard' : 'work_orders') : page;
    const PageComponent = PAGES[effectivePage] || DashboardPage;

    // ============================================================
    // NAVIGATION STRUCTURE — Grouped by business area
    // ============================================================
    const NAV_ITEMS = [
        { section: 'Principal' },
        { key: 'dashboard', label: 'Dashboard', icon: 'space_dashboard' },
        { key: 'work_orders', label: 'Órdenes de Trabajo', icon: 'assignment', badge: '3' },
        { key: 'daily_work', label: 'Trabajos del Día', icon: 'engineering' },

        { section: 'Gestión' },
        { key: 'clients', label: 'Clientes & Vehículos', icon: 'group' },
        { key: 'inventory', label: 'Inventario / Stock', icon: 'inventory_2', badgeAlert: getLowStockItems().length > 0 ? String(getLowStockItems().length) : null },
        { key: 'suppliers', label: 'Proveedores', icon: 'business' },

        { section: 'Finanzas' },
        { key: 'sales', label: 'Punto de Venta', icon: 'storefront' },
        { key: 'cash', label: 'Caja del Día', icon: 'point_of_sale' },

        { section: 'Planificación' },
        { key: 'calendar', label: 'Calendario Turnos', icon: 'calendar_month' },
        { key: 'promotions', label: 'Promociones', icon: 'loyalty' },
        { key: 'reports', label: 'Reportes y Estadísticas', icon: 'analytics' },

        { section: 'Configuración' },
        { key: 'users', label: 'Personal y Accesos', icon: 'admin_panel_settings' },
        { key: 'settings', label: 'Sistema / AFIP', icon: 'settings' },
        { key: 'audit', label: 'Auditoría', icon: 'security' },
    ];

    const handleNavigate = (key) => {
        setPage(key);
        setSidebarOpen(false);
    };

    const isVisible = (key) => {
        if (user.role === 'limpieza') return false; // Limpieza sees no modules
        switch (key) {
            case 'suppliers':
            case 'promotions':
            case 'reports':
            case 'users':
            case 'settings':
                return user.role === 'admin';
            case 'audit':
                return user.role === 'admin' && showAuditAdmin;
            case 'inventory':
            case 'dashboard':
            case 'sales':
            case 'cash':
            case 'clients':
            case 'calendar':
                return ['admin', 'cajero'].includes(user.role);
            case 'work_orders':
            case 'daily_work':
                return ['admin', 'cajero', 'mecanico', 'gomero'].includes(user.role);
            default:
                return true;
        }
    };

    const visibleNavItems = NAV_ITEMS.filter(item => item.section || isVisible(item.key));
    // Quitar secciones vacías
    const cleanNavItems = visibleNavItems.filter((item, i) => {
        if (item.section) {
            const nextNode = visibleNavItems[i + 1];
            return nextNode && !nextNode.section;
        }
        return true;
    });

    return (
        <div className="app-layout">
            {/* Overlay for mobile */}
            {sidebarOpen && <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand" onClick={handleLogoClick} style={{ cursor: 'default', userSelect: 'none' }}>
                    <div className="sidebar-brand-icon">
                        <Icon name="precision_manufacturing" />
                    </div>
                    <h1>PIRIPI <strong>SANTA FE</strong></h1>
                </div>

                <nav className="sidebar-nav">
                    {cleanNavItems.map((item, i) => {
                        if (item.section) {
                            return <div key={i} className="nav-section-title">{item.section}</div>;
                        }
                        return (
                            <div
                                key={item.key}
                                className={`nav-item ${page === item.key ? 'active' : ''}`}
                                onClick={() => handleNavigate(item.key)}
                            >
                                <Icon name={item.icon} />
                                <span>{item.label}</span>
                                {item.badge && <span className="nav-badge">{item.badge}</span>}
                                {item.badgeAlert && <span className="nav-badge alert">{item.badgeAlert}</span>}
                            </div>
                        );
                    })}
                </nav>

                {/* User info footer */}
                <div style={{ padding: '12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Icon name="person" size={18} style={{ color: 'white' }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.name}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{user.role.toUpperCase()} • v3.0.0</span>
                                <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 10, padding: 0 }}>Salir</button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <div className="main-area">
                {/* Header */}
                <header className="header">
                    <div className="header-left">
                        <button
                            className="btn-icon mobile-menu"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ display: 'none' }}
                        >
                            <Icon name="menu" size={22} />
                        </button>
                        <div className="header-title">
                            <h2>{pageInfo.title}</h2>
                            <p>{pageInfo.sub}</p>
                        </div>
                        <div style={{ height: 24, width: 1, background: 'var(--border)', margin: '0 4px' }} />
                        <div className="header-live">
                            <div className="live-dot" />
                            Activo
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="notif-btn">
                            <Icon name="notifications" size={20} />
                            <span className="notif-dot" />
                        </button>
                        <button className="header-btn" onClick={() => setShowTimeModal(true)}>
                            <Icon name="schedule" size={16} />
                            Fichar Ingreso/Salida
                        </button>
                        <button className="header-btn" onClick={() => setShowCameraScanner(true)}>
                            <Icon name="photo_camera" size={16} />
                            Cámara (Móvil)
                        </button>
                        <button className="header-btn" onClick={() => alert('Esperando código del lector láser USB/Bluetooth...')}>
                            <Icon name="qr_code_scanner" size={16} />
                            Lector Láser
                        </button>
                        <button className="header-btn primary" onClick={() => handleNavigate('work_orders')}>
                            <Icon name="add_circle" size={16} />
                            Nueva OT
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <PageComponent
                    onNavigate={handleNavigate}
                    initialScannedCode={page === 'inventory' ? scannedUnknownCode : null}
                />
            </div>

            {/* Modal Lector de Código de Barras */}
            {scannedItem && (
                <Modal
                    title="Producto Escaneado"
                    onClose={() => setScannedItem(null)}
                    footer={
                        <React.Fragment>
                            <button className="btn btn-ghost" onClick={() => setScannedItem(null)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={() => {
                                alert(`Registrando ${scannedQuantity}x ${scannedItem.name}`);
                                setScannedItem(null);
                            }}>
                                <Icon name="shopping_cart_checkout" size={18} /> Vender / Usar
                            </button>
                        </React.Fragment>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
                        <Icon name="check_circle" size={48} style={{ color: 'var(--success)', margin: '0 auto' }} />
                        <div>
                            <h3 style={{ fontSize: 20, margin: 0 }}>{scannedItem.name}</h3>
                            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Categoría: {scannedItem.category}</p>
                        </div>

                        <div style={{ padding: 16, background: 'var(--bg-hover)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Precio Sugerido</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(scannedItem.sell_price)}</div>
                            <div style={{ fontSize: 12, marginTop: 4, color: (scannedItem.stock_type === 'UNIT' ? (scannedItem.stock_quantity || 0) : (scannedItem.stock_ml || 0)) > 5 ? 'var(--success)' : 'var(--danger)' }}>
                                {scannedItem.stock_type === 'UNIT' ? `${scannedItem.stock_quantity || 0} unidades` : `${((scannedItem.stock_ml || 0) / 1000).toFixed(1)}L`} disponibles
                            </div>
                        </div>

                        <FormField label="Cantidad a descontar">
                            <input
                                type="number"
                                className="form-input"
                                value={scannedQuantity}
                                onChange={(e) => setScannedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                style={{ textAlign: 'center', fontSize: 18 }}
                            />
                        </FormField>
                    </div>
                </Modal>
            )}

            {/* Modal Fichaje (Reloj) */}
            {showTimeModal && (
                <Modal title="Fichaje de Personal" onClose={() => { setShowTimeModal(false); setTimePin(''); }} footer={
                    <React.Fragment>
                        <button className="btn btn-ghost" onClick={() => { setShowTimeModal(false); setTimePin(''); }}>Cancelar</button>
                    </React.Fragment>
                }>
                    <div style={{ padding: '0 20px', textAlign: 'center' }}>
                        <Icon name="alarm_on" size={56} style={{ color: 'var(--primary)', marginBottom: 16 }} />
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Reloj de Asistencia</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Ingresá tu PIN numérico personal para registrar tu entrada o salida.</p>

                        <div style={{ maxWidth: 300, margin: '0 auto' }}>
                            <FormField label="PIN de Acceso (4 dígitos)">
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
                                <button className="btn btn-success" style={{ flex: 1, padding: '16px 0', fontSize: 16, fontWeight: 700 }} onClick={() => {
                                    if (timePin.length < 4) return alert('El PIN debe tener 4 dígitos');
                                    try {
                                        const res = addTimeLog(timePin, 'IN');
                                        const empName = res?.emp?.name || res?.name || 'Empleado';
                                        alert(`✅ ¡ENTRADA REGISTRADA!\nEmpleado: ${empName}\nHora: ${res.time}\n\nPuede seguir trabajando normalmente.`);
                                        setShowTimeModal(false);
                                        setTimePin('');
                                    } catch (e) { alert(e.message); }
                                }}>
                                    ENTRADA
                                </button>
                                <button className="btn btn-danger" style={{ flex: 1, padding: '16px 0', fontSize: 16, fontWeight: 700 }} onClick={() => {
                                    if (timePin.length < 4) return alert('El PIN debe tener 4 dígitos');
                                    try {
                                        const res = addTimeLog(timePin, 'OUT');
                                        const empName = res?.emp?.name || res?.name || 'Empleado';
                                        alert(`👋 ¡SALIDA REGISTRADA!\nEmpleado: ${empName}\nHora: ${res.time}\n\n¡Hasta pronto!`);
                                        setShowTimeModal(false);
                                        setTimePin('');
                                    } catch (e) { alert(e.message); }
                                }}>
                                    SALIDA
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal Lector de Cámara del Celular/PC */}
            {showCameraScanner && (
                <CameraScanner
                    onScan={handleBarcodeScan}
                    onClose={() => setShowCameraScanner(false)}
                />
            )}
        </div>
    );
}

export default App;
