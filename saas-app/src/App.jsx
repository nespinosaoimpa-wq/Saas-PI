import React, { useState } from 'react';
import { MOCK, getLowStockItems } from './data/data';
import { Icon } from './components/ui';
import { DashboardPage } from './pages/DashboardPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { DailyWorkPage } from './pages/DailyWorkPage';
import { ClientsPage } from './pages/ClientsPage';
import { InventoryPage } from './pages/InventoryPage';
import { CashRegisterPage } from './pages/CashRegisterPage';
import { CalendarPage } from './pages/CalendarPage';
import { PromotionsPage } from './pages/PromotionsPage';

const NAV_ITEMS = [
    { section: 'Principal' },
    { key: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { key: 'work_orders', label: 'Ã“rdenes de Trabajo', icon: 'assignment', badge: '3' },
    { key: 'daily_work', label: 'Trabajos del DÃ­a', icon: 'engineering' },
    { section: 'GestiÃ³n' },
    { key: 'clients', label: 'Clientes', icon: 'group' },
    { key: 'inventory', label: 'Inventario / Stock', icon: 'inventory_2', badgeAlert: getLowStockItems().length > 0 ? String(getLowStockItems().length) : null },
    { key: 'cash', label: 'Caja', icon: 'payments' },
    { section: 'PlanificaciÃ³n' },
    { key: 'calendar', label: 'Calendario Turnos', icon: 'calendar_month' },
    { key: 'promotions', label: 'Promociones', icon: 'local_offer' },
];

const PAGE_TITLES = {
    dashboard: { title: 'COMMAND CENTER', sub: 'Sistema de Control Principal' },
    work_orders: { title: 'Ã“RDENES DE TRABAJO', sub: 'GestiÃ³n de OTs y Circuito de Trabajo' },
    daily_work: { title: 'TRABAJOS DEL DÃA', sub: 'Vista del MecÃ¡nico' },
    clients: { title: 'CLIENTES & VEHÃCULOS', sub: 'Fichas de Clientes y Patentes' },
    inventory: { title: 'INVENTARIO & STOCK', sub: 'Control de MercaderÃ­a y Niveles' },
    cash: { title: 'CAJA REGISTRO', sub: 'Balance Efectivo, Transferencia y Tarjeta' },
    calendar: { title: 'CALENDARIO DE TURNOS', sub: 'Agenda y Citas' },
    promotions: { title: 'PROMOCIONES', sub: 'GestiÃ³n de Ofertas y Descuentos' },
};

const PAGES = {
    dashboard: DashboardPage,
    work_orders: WorkOrdersPage,
    daily_work: DailyWorkPage,
    clients: ClientsPage,
    inventory: InventoryPage,
    cash: CashRegisterPage,
    calendar: CalendarPage,
    promotions: PromotionsPage,
};

function App() {
    const [page, setPage] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pageInfo = PAGE_TITLES[page] || PAGE_TITLES.dashboard;
    const PageComponent = PAGES[page] || DashboardPage;

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
                    <h1>PIRIPI <em>NEO</em></h1>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item, i) => {
                        if (item.section) return <div key={i} className="nav-section-title">{item.section}</div>;
                        return (
                            <div key={item.key} className={`nav-item ${page === item.key ? 'active' : ''}`}
                                onClick={() => { setPage(item.key); setSidebarOpen(false); }}>
                                <Icon name={item.icon} />
                                <span>{item.label}</span>
                                {item.badge && <span className="nav-badge">{item.badge}</span>}
                                {item.badgeAlert && <span className="nav-badge alert">{item.badgeAlert}</span>}
                            </div>
                        );
                    })}
                </nav>

                {/* User info */}
                <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(13,242,242,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name="person" size={20} className="neon-text" />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 1 }}>
                                {MOCK.currentUser.name}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                                {MOCK.currentUser.role.toUpperCase()} â€¢ v1.0.0
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
                        {/* Mobile menu button */}
                        <button className="btn btn-icon btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{ display: 'none', '@media(maxWidth:1024px)': { display: 'flex' } }}>
                            <Icon name="menu" size={20} />
                        </button>
                        <div className="header-title">
                            <h2>{pageInfo.title}</h2>
                            <p>{pageInfo.sub}</p>
                        </div>
                        <div style={{ height: 24, width: 1, background: 'var(--border)', margin: '0 8px' }} />
                        <div className="header-live">
                            <div className="live-dot" />
                            Sistema Activo
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="notif-btn">
                            <Icon name="notifications" size={20} />
                            <span className="notif-dot" />
                        </button>
                        <button className="header-btn">
                            <Icon name="qr_code_scanner" size={16} />
                            Escanear
                        </button>
                        <button className="header-btn primary">
                            <Icon name="add_circle" size={16} />
                            Nueva OT
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <PageComponent />
            </div>
        </div>
    );
}

export default App;
