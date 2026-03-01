import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Icon } from './components/ui';
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

const PAGE_TITLES = {
    dashboard: { title: 'Dashboard', sub: 'Panel de Control Principal' },
    work_orders: { title: 'Órdenes de Trabajo', sub: 'Gestión de OTs y Circuito de Trabajo' },
    daily_work: { title: 'Trabajos del Día', sub: 'Vista del Mecánico' },
    clients: { title: 'Clientes & Vehículos', sub: 'Fichas de Clientes y Patentes' },
    inventory: { title: 'Inventario & Stock', sub: 'Control de Mercadería y Niveles' },
    suppliers: { title: 'Proveedores', sub: 'Gestión de Proveedores de Insumos' },
    cash: { title: 'Caja del Día', sub: 'Balance Efectivo, Transferencia y Tarjeta' },
    calendar: { title: 'Calendario de Turnos', sub: 'Agenda y Citas Programadas' },
    promotions: { title: 'Promociones', sub: 'Gestión de Ofertas y Descuentos' },
    reports: { title: 'Reportes & Estadísticas', sub: 'Análisis de Rentabilidad y Rendimiento' },
};

const PAGES = {
    dashboard: DashboardPage,
    work_orders: WorkOrdersPage,
    daily_work: DailyWorkPage,
    clients: ClientsPage,
    inventory: InventoryPage,
    suppliers: SuppliersPage,
    cash: CashRegisterPage,
    calendar: CalendarPage,
    promotions: PromotionsPage,
    reports: ReportsPage,
};

function App() {
    const { data: MOCK, getLowStockItems } = useApp();
    const [page, setPage] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pageInfo = PAGE_TITLES[page] || PAGE_TITLES.dashboard;
    const PageComponent = PAGES[page] || DashboardPage;

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
        { key: 'cash', label: 'Caja del Día', icon: 'point_of_sale' },

        { section: 'Planificación' },
        { key: 'calendar', label: 'Calendario Turnos', icon: 'calendar_month' },
        { key: 'promotions', label: 'Promociones', icon: 'loyalty' },
        { key: 'reports', label: 'Reportes y Estadísticas', icon: 'analytics' },
    ];

    const handleNavigate = (key) => {
        setPage(key);
        setSidebarOpen(false);
    };

    return (
        <div className="app-layout">
            {/* Overlay for mobile */}
            {sidebarOpen && <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <Icon name="precision_manufacturing" />
                    </div>
                    <h1>PIRIPI <strong>PRO</strong></h1>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item, i) => {
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
                                {MOCK.currentUser.name}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                                {MOCK.currentUser.role.toUpperCase()} • v2.0
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
                        <button className="header-btn" onClick={() => handleNavigate('work_orders')}>
                            <Icon name="qr_code_scanner" size={16} />
                            Escanear
                        </button>
                        <button className="header-btn primary" onClick={() => handleNavigate('work_orders')}>
                            <Icon name="add_circle" size={16} />
                            Nueva OT
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <PageComponent onNavigate={handleNavigate} />
            </div>
        </div>
    );
}

export default App;
