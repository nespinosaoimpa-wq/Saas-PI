import React, { useState } from 'react';
import { supabase } from './lib/supabase';
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
import { HelpPage } from './pages/HelpPage';
import { HouseCreditPage } from './pages/HouseCreditPage';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useNavigation } from './hooks/useNavigation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

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
    house_credit: HouseCreditPage,
    audit: ProgrammerAuditPage,
    help: HelpPage,
};

function App() {
    const isOnline = useNetworkStatus();
    const { data: MOCK, timeTrackingLogs, addTimeLog, isSyncing } = useApp();
    const { user } = useAuth();
    
    // Custom Navigation Hook
    const {
        page,
        effectivePage,
        pageInfo,
        sidebarOpen,
        setSidebarOpen,
        navItems,
        handleNavigate,
        isVisible
    } = useNavigation();

    // UI States
    const [scannedItem, setScannedItem] = useState(null);
    const [scannedQuantity, setScannedQuantity] = useState(1);
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [scannedUnknownCode, setScannedUnknownCode] = useState(null);
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [timePin, setTimePin] = useState('');
    const [isClockingIn, setIsClockingIn] = useState(false);
    const [isClockingOut, setIsClockingOut] = useState(false);
    
    // --- ESTADO PARA AVISO DE SERVICIO DEGRADADO ---
    const [showPaymentReminder, setShowPaymentReminder] = useState(true);

    // --- TRACKING GLOBAL DEL MAPA DE CALOR ---
    React.useEffect(() => {
        const handleClick = async (e) => {
            if (!user) return;
            const target = e.target.closest('button, a, [role="button"], .nav-item, .card, .quick-action-card');
            if (target) {
                let btnId = target.id || target.getAttribute('aria-label') || target.textContent?.trim()?.substring(0, 30) || target.className || 'Botón Desconocido';
                if (!btnId || btnId.trim() === '') return;
                
                try {
                    const currentPageName = pageInfo.title || page;
                    const { data, error: selectError } = await supabase
                        .from('button_clicks')
                        .select('id, count')
                        .eq('button_id', btnId)
                        .eq('page', currentPageName)
                        .maybeSingle();
                    
                    if (selectError) throw selectError;

                    if (data) {
                        await supabase.from('button_clicks').update({ count: (data.count || 0) + 1 }).eq('id', data.id);
                    } else {
                        await supabase.from('button_clicks').insert([{
                            button_id: btnId,
                            page: currentPageName,
                            employee_id: user.id,
                            count: 1
                        }]);
                    }
                } catch (err) {
                    console.error('Error de Auditoría (Tracking):', err.message);
                }
            }
        };

        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [user, page, pageInfo.title]);

    const handleBarcodeScan = (code) => {
        if (!user) return;
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
            if (window.confirm(`Código ${code} no encontrado. ¿Deseas agregarlo?`)) {
                setScannedUnknownCode(code);
                setPage('inventory');
            }
            setShowCameraScanner(false);
        }
    };

    useBarcodeScanner(handleBarcodeScan);

    if (!user) return <LoginPage />;

    const PageComponent = PAGES[effectivePage] || DashboardPage;

    return (
        <div className="app-layout">
            {/* --- RECORDATORIO DE PAGO (TOAST FIJO CON CIERRE MANUAL) --- */}
            {showPaymentReminder && user && (
                <div style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    backgroundColor: 'var(--card-bg, #ffffff)',
                    color: 'var(--text-color, #333333)',
                    padding: '20px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    zIndex: 999999,
                    maxWidth: '420px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderLeft: '5px solid var(--danger, #ef4444)',
                    animation: 'slideInRight 0.3s ease-out'
                }}>
                    <Icon name="warning" size={28} style={{ color: 'var(--danger, #ef4444)', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 'bold', color: 'var(--danger, #ef4444)', letterSpacing: '0.5px' }}>
                            ÚLTIMO AVISO DE PAGO
                        </h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-color, #333333)', lineHeight: '1.5' }}>
                            Se registra un saldo pendiente por el desarrollo de la plataforma. De no regularizarse el pago, <strong>el servicio será dado de baja de forma definitiva</strong>.
                        </p>
                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-color, #333333)', lineHeight: '1.5' }}>
                            Por favor, póngase en contacto con el programador a la brevedad para regularizar su situación.
                        </p>
                        <div style={{ 
                            fontSize: '12px', 
                            background: 'rgba(239, 68, 68, 0.08)', 
                            padding: '8px 12px', 
                            borderRadius: '6px', 
                            border: '1px dashed rgba(239, 68, 68, 0.3)',
                            marginBottom: '12px',
                            color: '#b91c1c',
                            fontWeight: '600'
                        }}>
                            Fecha límite: Viernes 21/05/2026
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted, #777)', textAlign: 'right', fontWeight: 'bold' }}>
                            SmartFlow Digital
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowPaymentReminder(false)}
                        style={{ background: 'var(--bg-hover, #f3f4f6)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted, #666)', cursor: 'pointer', flexShrink: 0 }}
                        title="Cerrar aviso"
                    >
                        <Icon name="close" size={16} />
                    </button>
                </div>
            )}
            
            {sidebarOpen && <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />}

            <Sidebar 
                navItems={navItems}
                currentPage={page}
                onNavigate={handleNavigate}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <div className="main-area">
                {!isOnline && (
                    <div className="offline-notice">
                        <Icon name="wifi_off" size={20} />
                        SIN CONEXIÓN A INTERNET: Los cambios locales pueden no sincronizarse.
                    </div>
                )}

                <Header 
                    pageInfo={pageInfo}
                    isOnline={isOnline}
                    isSyncing={isSyncing}
                    onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                    showTimeModal={() => setShowTimeModal(true)}
                    showCameraScanner={() => setShowCameraScanner(true)}
                    onNewWorkOrder={() => handleNavigate('work_orders')}
                    showNewWOButton={isVisible('work_orders')}
                />

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
                            {timePin.length === 4 && (MOCK.employees || []).find(e => String(e.pin) === String(timePin)) && (() => {
                                const emp = MOCK.employees.find(e => String(e.pin) === String(timePin));
                                const last = (timeTrackingLogs || []).filter(l => l.employee_id === emp.id)[0];
                                return (
                                    <div style={{ 
                                        padding: '8px 12px', 
                                        borderRadius: 8, 
                                        background: last?.type === 'IN' ? 'var(--success-light)' : 'var(--bg-hover)',
                                        marginBottom: 16,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: last?.type === 'IN' ? 'var(--success-dark)' : 'var(--text-muted)'
                                    }}>
                                        <Icon name={last?.type === 'IN' ? 'check_circle' : 'history'} size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                                        {last?.type === 'IN' ? `ACTUALMENTE: DENTRO (desde ${last.time_display})` : 'ACTUALMENTE: FUERA'}
                                    </div>
                                );
                            })()}
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
                                <button className="btn btn-success" disabled={isClockingIn || isClockingOut} style={{ flex: 1, padding: '16px 0', fontSize: 16, fontWeight: 700 }} onClick={async () => {
                                    if (timePin.length < 4) return alert('El PIN debe tener 4 dígitos');
                                    setIsClockingIn(true);
                                    try {
                                        const res = await addTimeLog(timePin, 'IN');
                                        const empName = res?.emp?.name || res?.name || 'Empleado';
                                        alert(`✅ ¡ENTRADA REGISTRADA!\nEmpleado: ${empName}\nHora: ${res.time}\n\nPuede seguir trabajando normalmente.`);
                                        setShowTimeModal(false);
                                        setTimePin('');
                                    } catch (e) { alert(e.message); } finally { setIsClockingIn(false); }
                                }}>
                                    {isClockingIn ? 'Procesando...' : 'ENTRADA'}
                                </button>
                                <button className="btn btn-danger" disabled={isClockingIn || isClockingOut} style={{ flex: 1, padding: '16px 0', fontSize: 16, fontWeight: 700 }} onClick={async () => {
                                    if (timePin.length < 4) return alert('El PIN debe tener 4 dígitos');
                                    setIsClockingOut(true);
                                    try {
                                        const res = await addTimeLog(timePin, 'OUT');
                                        const empName = res?.emp?.name || res?.name || 'Empleado';
                                        alert(`👋 ¡SALIDA REGISTRADA!\nEmpleado: ${empName}\nHora: ${res.time}\n\n¡Hasta pronto!`);
                                        setShowTimeModal(false);
                                        setTimePin('');
                                    } catch (e) { alert(e.message); } finally { setIsClockingOut(false); }
                                }}>
                                    {isClockingOut ? 'Procesando...' : 'SALIDA'}
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
