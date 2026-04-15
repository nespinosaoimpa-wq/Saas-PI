import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export const PAGE_TITLES = {
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
    house_credit: { title: 'Crédito de la Casa', sub: 'Gestión de Cuotas y Cuentas Corrientes' },
    audit: { title: 'Auditoría del Sistema', sub: 'Registro de Actividad y Uso de la Plataforma' },
    help: { title: 'Centro de Ayuda', sub: 'Manual, Guías y Soporte Técnico' },
};

export function useNavigation() {
    const { getLowStockItems } = useApp();
    const { user } = useAuth();
    const [page, setPage] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Modo programador persistente
    const [showAuditAdmin, setShowAuditAdmin] = useState(() => localStorage.getItem('piripi_dev_mode') === 'true');

    useEffect(() => {
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
        { key: 'house_credit', label: 'Cuentas Corrientes', icon: 'account_balance_wallet' },

        { section: 'Planificación' },
        { key: 'calendar', label: 'Calendario Turnos', icon: 'calendar_month' },
        { key: 'promotions', label: 'Promociones', icon: 'loyalty' },
        { key: 'reports', label: 'Reportes y Estadísticas', icon: 'analytics' },

        { section: 'Configuración' },
        { key: 'users', label: 'Personal y Accesos', icon: 'admin_panel_settings' },
        { key: 'settings', label: 'Sistema / AFIP', icon: 'settings' },
        { key: 'audit', label: 'Auditoría', icon: 'security' },
        { key: 'help', label: 'Centro de Ayuda', icon: 'help_center' },
    ];

    const isVisible = (key) => {
        if (!user) return false;
        if (user.role === 'limpieza') return false;
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
            case 'house_credit':
            case 'clients':
            case 'calendar':
            case 'help':
                return ['admin', 'cajero'].includes(user.role);
            case 'work_orders':
            case 'daily_work':
                return ['admin', 'cajero', 'mecanico', 'gomero'].includes(user.role);
            default:
                return true;
        }
    };

    const handleNavigate = (key) => {
        setPage(key);
        setSidebarOpen(false);
    };

    const visibleNavItems = NAV_ITEMS.filter(item => item.section || isVisible(item.key));
    const cleanNavItems = visibleNavItems.filter((item, i) => {
        if (item.section) {
            const nextNode = visibleNavItems[i + 1];
            return nextNode && !nextNode.section;
        }
        return true;
    });

    const pageInfo = PAGE_TITLES[page] || PAGE_TITLES.dashboard;
    const effectivePage = (page === 'dashboard' && user && !['admin', 'cajero'].includes(user.role)) ? (user.role === 'limpieza' ? 'dashboard' : 'work_orders') : page;

    return {
        page,
        setPage,
        effectivePage,
        pageInfo,
        sidebarOpen,
        setSidebarOpen,
        navItems: cleanNavItems,
        handleNavigate,
        showAuditAdmin,
        setShowAuditAdmin,
        isVisible
    };
}
