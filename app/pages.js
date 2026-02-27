// ============================================================
// SAAS PIRIPI - Page Components
// ============================================================

// ================================================================
// PAGE: DASHBOARD
// ================================================================
const DashboardPage = () => {
    const activeOrders = MOCK.workOrders.filter(wo => wo.status !== 'Finalizado' && wo.status !== 'Cancelado');
    const completedToday = MOCK.workOrders.filter(wo => wo.status === 'Finalizado' && wo.completed_at?.startsWith('2026-02-2')).length;
    const lowStock = getLowStockItems();
    const todayPayments = MOCK.payments.filter(p => p.date === '2026-02-27');
    const todayTotal = todayPayments.reduce((s, p) => s + p.amount, 0);
    const boxOccupied = MOCK.boxes.filter(b => b.status === 'Ocupado').length;

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                {/* KPI Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                    <StatCard icon="payments" label="Facturación Hoy" value={formatCurrency(todayTotal)} sub="2 cobros registrados" tag="24H" barPercent={65} />
                    <StatCard icon="build" label="OTs Activas" value={activeOrders.length} sub={`${completedToday} finalizadas hoy`} tag="Live" barPercent={(activeOrders.length / 4) * 100} barAlert />
                    <StatCard icon="garage" label="Boxes Ocupados" value={`${boxOccupied}/${MOCK.boxes.length}`} sub={boxOccupied < MOCK.boxes.length ? 'Hay boxes disponibles' : 'Todos ocupados'} barPercent={(boxOccupied / MOCK.boxes.length) * 100} />
                    <StatCard icon="inventory_2" label="Stock" value={`${MOCK.inventory.length - lowStock.length}/${MOCK.inventory.length}`} sub={lowStock.length > 0 ? `⚠ ${lowStock.length} items bajo mínimo` : 'Todo OK'} barPercent={((MOCK.inventory.length - lowStock.length) / MOCK.inventory.length) * 100} barAlert={lowStock.length > 0} />
                </div>

                {/* Main grid: Queue + Sidebar */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                    {/* Service Queue */}
                    <div>
                        <SectionHeader icon="checklist_rtl" title="Cola de Servicio Activa" right={
                            <Fragment>
                                <button className="btn btn-sm btn-ghost"><Icon name="filter_list" size={16} /> Filtrar</button>
                            </Fragment>
                        } />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {MOCK.workOrders.slice(0, 4).map(wo => <QueueCard key={wo.id} wo={wo} />)}
                        </div>
                    </div>

                    {/* Right sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Revenue Chart */}
                        <GlassCard style={{ padding: 20 }}>
                            <SectionHeader icon="bar_chart" title="Ingresos Semanal" />
                            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>{formatCurrency(MOCK.revenue.weekly_total)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Mes: {formatCurrency(MOCK.revenue.monthly_total)}</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
                                {MOCK.revenue.daily.map((d, i) => {
                                    const max = Math.max(...MOCK.revenue.daily.map(x => x.cash + x.transfer + x.card));
                                    const total = d.cash + d.transfer + d.card;
                                    const h = (total / max) * 100;
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                            <div style={{ width: '100%', borderRadius: '3px 3px 0 0', background: i === 4 ? 'var(--primary)' : 'rgba(13,242,242,0.25)', height: h + '%', minHeight: 4, transition: 'height 0.5s' }} />
                                            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>{d.day}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </GlassCard>

                        {/* Low Stock Alerts */}
                        <GlassCard style={{ padding: 20 }}>
                            <SectionHeader icon="warning" title="Alertas Stock" right={
                                <span className="nav-badge alert">{lowStock.length}</span>
                            } />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {lowStock.map(item => (
                                    <div key={item.id} className="neon-border-left" style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(255,51,102,0.05)', borderLeft: '3px solid var(--danger)' }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {item.stock_type === 'VOLUME'
                                                ? `${formatML(item.stock_ml)} / mín. ${formatML(item.stock_min_ml)}`
                                                : `${item.stock_quantity} uds / mín. ${item.stock_min}`
                                            }
                                        </div>
                                    </div>
                                ))}
                                {lowStock.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 16, textAlign: 'center' }}>Sin alertas</div>}
                            </div>
                        </GlassCard>

                        {/* Box Status */}
                        <GlassCard style={{ padding: 20 }}>
                            <SectionHeader icon="garage" title="Estado Boxes" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {MOCK.boxes.map(box => (
                                    <div key={box.id} style={{ padding: 12, borderRadius: 8, background: box.status === 'Ocupado' ? 'rgba(13,242,242,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${box.status === 'Ocupado' ? 'rgba(13,242,242,0.2)' : 'var(--border)'}` }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{box.name}</div>
                                        <StatusBadge status={box.status === 'Ocupado' ? 'En Box' : box.status} />
                                        {box.mechanic && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{box.mechanic}</div>}
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ================================================================
// PAGE: CLIENTES
// ================================================================
const ClientsPage = () => {
    const [search, setSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [showNewModal, setShowNewModal] = useState(false);

    const filtered = MOCK.clients.filter(c =>
        `${c.first_name} ${c.last_name} ${c.phone} ${c.dni}`.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 250 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar cliente por nombre, teléfono o DNI..." /></div>
                    <button className="btn btn-primary" onClick={() => setShowNewModal(true)}><Icon name="person_add" size={18} /> Nuevo Cliente</button>
                    <button className="btn btn-ghost"><Icon name="group" size={18} /> Cliente Existente</button>
                </div>

                <DataTable
                    columns={[
                        { key: 'name', label: 'Cliente', render: r => <div><strong>{r.first_name} {r.last_name}</strong>{r.is_frequent && <span style={{ marginLeft: 8, fontSize: 9, color: 'var(--alert)', fontWeight: 700 }}>★ FRECUENTE</span>}</div> },
                        { key: 'phone', label: 'Teléfono' },
                        { key: 'email', label: 'Email' },
                        { key: 'dni', label: 'DNI' },
                        { key: 'vehicles', label: 'Vehículos', render: r => <span className="nav-badge">{r.vehicles.length}</span> },
                        { key: 'actions', label: '', render: r => <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); setSelectedClient(r); }}>Ver Ficha</button> },
                    ]}
                    data={filtered}
                    onRowClick={r => setSelectedClient(r)}
                />

                {selectedClient && (
                    <Modal title={`Ficha: ${selectedClient.first_name} ${selectedClient.last_name}`} onClose={() => setSelectedClient(null)} width="800px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setSelectedClient(null)}>Cerrar</button><button className="btn btn-primary">Editar Cliente</button></Fragment>}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                            <FormField label="Teléfono"><div style={{ fontSize: 14, fontWeight: 600, padding: '10px 0' }}>{selectedClient.phone}</div></FormField>
                            <FormField label="Email"><div style={{ fontSize: 14, fontWeight: 600, padding: '10px 0' }}>{selectedClient.email}</div></FormField>
                            <FormField label="DNI"><div style={{ fontSize: 14, fontWeight: 600, padding: '10px 0' }}>{selectedClient.dni}</div></FormField>
                            <FormField label="Estado"><div style={{ padding: '10px 0' }}>{selectedClient.is_frequent ? <span className="badge badge-done">Frecuente</span> : <span className="badge badge-pending">Normal</span>}</div></FormField>
                        </div>
                        <SectionHeader icon="directions_car" title="Vehículos" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {getClientVehicles(selectedClient.id).map(v => (
                                <div key={v.id} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{v.brand} {v.model} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({v.year})</span></div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Patente: <strong style={{ color: 'var(--primary)' }}>{v.license_plate}</strong> • {v.km.toLocaleString()} km • Color: {v.color}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Factor dificultad: ×{v.difficulty_factor}</div>
                                    </div>
                                    <HealthRing score={v.health_score} size={52} />
                                </div>
                            ))}
                        </div>
                    </Modal>
                )}

                {showNewModal && (
                    <Modal title="Nuevo Cliente" onClose={() => setShowNewModal(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNewModal(false)}>Cancelar</button><button className="btn btn-primary">Guardar</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormRow>
                                <FormField label="Nombre"><input className="form-input" placeholder="Nombre" /></FormField>
                                <FormField label="Apellido"><input className="form-input" placeholder="Apellido" /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Teléfono"><input className="form-input" placeholder="11-XXXX-XXXX" /></FormField>
                                <FormField label="DNI"><input className="form-input" placeholder="DNI" /></FormField>
                            </FormRow>
                            <FormField label="Email"><input className="form-input" placeholder="email@ejemplo.com" type="email" /></FormField>
                            <FormField label="Dirección"><input className="form-input" placeholder="Dirección" /></FormField>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                            <h4 style={{ fontSize: 14, fontWeight: 700 }}>Agregar Vehículo</h4>
                            <FormRow>
                                <FormField label="Patente"><input className="form-input" placeholder="AA 000 BB" /></FormField>
                                <FormField label="Marca"><input className="form-input" placeholder="Ej: Toyota" /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Modelo"><input className="form-input" placeholder="Ej: Corolla" /></FormField>
                                <FormField label="Año"><input className="form-input" type="number" placeholder="2024" /></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Kilometraje"><input className="form-input" type="number" placeholder="0" /></FormField>
                                <FormField label="Color"><input className="form-input" placeholder="Color" /></FormField>
                            </FormRow>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};

// ================================================================
// PAGE: INVENTARIO / STOCK
// ================================================================
const InventoryPage = () => {
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('all');
    const [showEntry, setShowEntry] = useState(false);

    const categories = [...new Set(MOCK.inventory.map(i => i.category))];
    const brands = [...new Set(MOCK.inventory.map(i => i.brand))];
    const filtered = MOCK.inventory.filter(i => {
        const matchSearch = `${i.name} ${i.barcode} ${i.brand} ${i.category}`.toLowerCase().includes(search.toLowerCase());
        const matchTab = tab === 'all' || (tab === 'low' && ((i.stock_type === 'UNIT' && i.stock_quantity <= i.stock_min) || (i.stock_type === 'VOLUME' && i.stock_ml <= i.stock_min_ml))) || (tab === 'volume' && i.stock_type === 'VOLUME') || (tab === 'unit' && i.stock_type === 'UNIT');
        return matchSearch && matchTab;
    });

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 250 }}><SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, código de barras, marca..." /></div>
                    <Tabs tabs={[{ key: 'all', label: 'Todos' }, { key: 'volume', label: 'Volumen' }, { key: 'unit', label: 'Unidad' }, { key: 'low', label: '⚠ Bajo Stock' }]} active={tab} onChange={setTab} />
                    <button className="btn btn-primary" onClick={() => setShowEntry(true)}><Icon name="add_shopping_cart" size={18} /> Ingreso Mercadería</button>
                    <button className="btn btn-ghost"><Icon name="download" size={18} /> Exportar Excel</button>
                </div>

                {/* Volume gauges for oils */}
                {(tab === 'all' || tab === 'volume') && (
                    <div>
                        <SectionHeader icon="water_drop" title="Niveles de Aceite / Fluidos" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
                            {MOCK.inventory.filter(i => i.stock_type === 'VOLUME').map(item => (
                                <GlassCard key={item.id} style={{ padding: 16 }}>
                                    <LiquidGauge label={item.name.split(' ').slice(0, 3).join(' ')} current_ml={item.stock_ml} max_ml={item.container_size_ml * 15} min_ml={item.stock_min_ml} />
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                        Precio/L: {formatCurrency(item.sell_price)} • Costo: {formatCurrency(item.cost_price)}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                )}

                <DataTable
                    columns={[
                        { key: 'name', label: 'Producto', render: r => <div><strong>{r.name}</strong><div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{r.barcode || 'Sin código'}</div></div> },
                        { key: 'category', label: 'Categoría' },
                        { key: 'brand', label: 'Marca' },
                        { key: 'supplier', label: 'Proveedor' },
                        {
                            key: 'stock', label: 'Stock', render: r => {
                                const isLow = (r.stock_type === 'UNIT' && r.stock_quantity <= r.stock_min) || (r.stock_type === 'VOLUME' && r.stock_ml <= r.stock_min_ml);
                                return <span style={{ color: isLow ? 'var(--danger)' : 'var(--primary)', fontWeight: 700 }}>
                                    {r.stock_type === 'VOLUME' ? formatML(r.stock_ml) : `${r.stock_quantity} uds`}
                                </span>;
                            }
                        },
                        { key: 'cost', label: 'Costo', render: r => formatCurrency(r.cost_price) },
                        { key: 'price', label: 'Venta', render: r => <strong style={{ color: 'var(--primary)' }}>{formatCurrency(r.sell_price)}{r.stock_type === 'VOLUME' ? '/L' : ''}</strong> },
                    ]}
                    data={filtered}
                />

                {showEntry && (
                    <Modal title="Ingreso de Mercadería" onClose={() => setShowEntry(false)} width="700px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowEntry(false)}>Cancelar</button><button className="btn btn-primary">Guardar Ingreso</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Modificar precio o cantidad masivamente. Filtrar por marca o proveedor.</p>
                            <FormRow>
                                <FormField label="Filtrar por Marca">
                                    <select className="form-select"><option value="">Todas las marcas</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}</select>
                                </FormField>
                                <FormField label="Filtrar por Proveedor">
                                    <select className="form-select"><option value="">Todos los proveedores</option>{MOCK.suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
                                </FormField>
                            </FormRow>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                            <FormRow>
                                <FormField label="Producto"><select className="form-select"><option value="">Seleccionar producto...</option>{MOCK.inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Cantidad a ingresar"><input className="form-input" type="number" placeholder="0" /></FormField>
                                <FormField label="Nuevo precio costo"><input className="form-input" type="number" placeholder="$0.00" /></FormField>
                                <FormField label="Nuevo precio venta"><input className="form-input" type="number" placeholder="$0.00" /></FormField>
                            </FormRow>
                            <FormField label="Escanear código de barras">
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input className="form-input" placeholder="Escanear o ingresar código EAN..." style={{ flex: 1 }} />
                                    <button className="btn btn-ghost"><Icon name="qr_code_scanner" size={18} /></button>
                                </div>
                            </FormField>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};

// ================================================================
// PAGE: ÓRDENES DE TRABAJO
// ================================================================
const WorkOrdersPage = () => {
    const [tab, setTab] = useState('active');
    const [showNew, setShowNew] = useState(false);
    const [checklist, setChecklist] = useState({});

    const filtered = MOCK.workOrders.filter(wo => {
        if (tab === 'active') return wo.status === 'Pendiente' || wo.status === 'En Box';
        if (tab === 'done') return wo.status === 'Finalizado';
        return true;
    });

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs tabs={[{ key: 'active', label: 'Activas' }, { key: 'done', label: 'Finalizadas' }, { key: 'all', label: 'Todas' }]} active={tab} onChange={setTab} />
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="add_circle" size={18} /> Nueva OT</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {filtered.map(wo => <QueueCard key={wo.id} wo={wo} />)}
                    {filtered.length === 0 && <EmptyState icon="assignment" title="Sin órdenes" sub="No hay órdenes para este filtro" />}
                </div>

                {showNew && (
                    <Modal title="Nueva Orden de Trabajo" onClose={() => setShowNew(false)} width="800px"
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button><button className="btn btn-primary"><Icon name="print" size={16} /> Crear y Generar Ticket</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormRow>
                                <FormField label="Cliente">
                                    <select className="form-select"><option value="">Seleccionar cliente...</option>{MOCK.clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}</select>
                                </FormField>
                                <FormField label="Vehículo">
                                    <select className="form-select"><option value="">Seleccionar vehículo...</option>{MOCK.vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate} - {v.brand} {v.model}</option>)}</select>
                                </FormField>
                            </FormRow>
                            <FormRow>
                                <FormField label="Box asignado">
                                    <select className="form-select"><option value="">Sin asignar</option>{MOCK.boxes.filter(b => b.status === 'Libre').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                                </FormField>
                                <FormField label="Km al ingresar"><input className="form-input" type="number" placeholder="Km actual" /></FormField>
                            </FormRow>
                            <FormField label="Descripción del trabajo"><textarea className="form-textarea" placeholder="Describir el trabajo a realizar..." /></FormField>
                            <FormField label="Fotos del vehículo">
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn btn-ghost" style={{ flex: 1 }}><Icon name="photo_camera" size={18} /> Tomar Fotos</button>
                                    <button className="btn btn-ghost" style={{ flex: 1 }}><Icon name="upload_file" size={18} /> Subir Archivos</button>
                                </div>
                            </FormField>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                            <SectionHeader icon="checklist" title="Checklist de Seguridad" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {MOCK.checklist_template.map(item => (
                                    <CheckItem key={item.key} label={item.label} sub={item.group} checked={checklist[item.key]} onChange={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))} />
                                ))}
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                            <SectionHeader icon="calculate" title="Precio Dinámico" />
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fórmula: (Insumo × Cantidad) + (Mano de Obra × Factor Dificultad del vehículo)</p>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};

// ================================================================
// PAGE: CAJA / CASH REGISTER
// ================================================================
const CashRegisterPage = () => {
    const [period, setPeriod] = useState('daily');
    const [showNew, setShowNew] = useState(false);

    const todayPayments = MOCK.payments.filter(p => p.date === '2026-02-27');
    const cash = todayPayments.filter(p => p.method === 'EFECTIVO').reduce((s, p) => s + p.amount, 0);
    const transfer = todayPayments.filter(p => p.method === 'TRANSFERENCIA').reduce((s, p) => s + p.amount, 0);
    const card = todayPayments.filter(p => p.method === 'TARJETA').reduce((s, p) => s + p.amount, 0);

    const allPayments = period === 'daily' ? MOCK.payments.filter(p => p.date === '2026-02-27')
        : period === 'weekly' ? MOCK.payments.filter(p => p.date >= '2026-02-21')
            : MOCK.payments;

    const totalPeriod = allPayments.reduce((s, p) => s + p.amount, 0);

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tabs tabs={[{ key: 'daily', label: 'Diario' }, { key: 'weekly', label: 'Semanal' }, { key: 'monthly', label: 'Mensual' }]} active={period} onChange={setPeriod} />
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={() => setShowNew(true)}><Icon name="add" size={18} /> Registrar Cobro</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                    <StatCard icon="payments" label={`Total ${period === 'daily' ? 'Hoy' : period === 'weekly' ? 'Semana' : 'Mes'}`} value={formatCurrency(totalPeriod)} sub={`${allPayments.length} operaciones`} barPercent={75} />
                    <StatCard icon="account_balance_wallet" label="Efectivo" value={formatCurrency(cash)} sub="Hoy" barPercent={cash > 0 ? 100 : 0} barAlert />
                    <StatCard icon="swap_horiz" label="Transferencias" value={formatCurrency(transfer)} sub="Hoy" barPercent={transfer > 0 ? 100 : 0} />
                    <StatCard icon="credit_card" label="Tarjeta" value={formatCurrency(card)} sub="Hoy" barPercent={card > 0 ? 100 : 0} />
                </div>

                <DataTable
                    columns={[
                        { key: 'date', label: 'Fecha' },
                        { key: 'amount', label: 'Monto', render: r => <strong style={{ color: 'var(--primary)' }}>{formatCurrency(r.amount)}</strong> },
                        { key: 'method', label: 'Método', render: r => <StatusBadge status={r.method === 'EFECTIVO' ? 'Pendiente' : r.method === 'TRANSFERENCIA' ? 'En Box' : 'Finalizado'} /> },
                        { key: 'reference', label: 'Referencia', render: r => r.reference || '—' },
                        { key: 'wo', label: 'OT', render: r => r.work_order_id ? <span className="nav-badge">OT</span> : '—' },
                    ]}
                    data={allPayments}
                />

                {showNew && (
                    <Modal title="Registrar Cobro" onClose={() => setShowNew(false)}
                        footer={<Fragment><button className="btn btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button><button className="btn btn-primary">Registrar</button></Fragment>}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <FormField label="Monto"><input className="form-input" type="number" placeholder="$0.00" /></FormField>
                            <FormField label="Método de pago">
                                <select className="form-select"><option value="EFECTIVO">Efectivo</option><option value="TRANSFERENCIA">Transferencia</option><option value="TARJETA">Tarjeta</option></select>
                            </FormField>
                            <FormField label="Referencia (opcional)"><input className="form-input" placeholder="Nº tarjeta, CBU, etc." /></FormField>
                            <FormField label="OT asociada (opcional)">
                                <select className="form-select"><option value="">Sin OT</option>{MOCK.workOrders.map(wo => <option key={wo.id} value={wo.id}>OT #{wo.order_number} - {wo.description}</option>)}</select>
                            </FormField>
                            <FormField label="Descripción"><input className="form-input" placeholder="Descripción del cobro" /></FormField>
                        </div>
                    </Modal>
                )}
            </div>
        </div>
    );
};

// ================================================================
// PAGE: CALENDARIO DE TURNOS
// ================================================================
const CalendarPage = () => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = 27;
    const daysInMonth = 28;
    const firstDayOfWeek = 6; // Feb 2026 starts on Saturday

    const cells = [];
    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr 340px' }}>
                <div>
                    <SectionHeader icon="calendar_month" title="Febrero 2026" right={
                        <button className="btn btn-primary btn-sm"><Icon name="add" size={16} /> Nuevo Turno</button>
                    } />
                    <GlassCard style={{ padding: 20 }}>
                        <div className="calendar-grid">
                            {days.map(d => <div key={d} className="calendar-day-header">{d}</div>)}
                            {cells.map((d, i) => (
                                <div key={i} className={`calendar-cell ${d === today ? 'today' : ''} ${d && MOCK.appointments.some(a => a.date === `2026-02-${String(d).padStart(2, '0')}`) ? 'has-event' : ''}`}>
                                    {d && <span style={{ fontSize: 12, fontWeight: d === today ? 700 : 400, color: d === today ? 'var(--primary)' : 'var(--text-secondary)' }}>{d}</span>}
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                <div>
                    <SectionHeader icon="event" title="Turnos del Día" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {MOCK.appointments.filter(a => a.date === '2026-02-27').map(apt => (
                            <GlassCard key={apt.id} style={{ padding: 16, borderLeft: `3px solid ${apt.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700 }}>{apt.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{apt.client} • {apt.vehicle}</div>
                                    </div>
                                    <StatusBadge status={apt.status} />
                                </div>
                                <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                                    <span><Icon name="schedule" size={14} /> {apt.time}</span>
                                    <span><Icon name="garage" size={14} /> {apt.box}</span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>
                    <div style={{ marginTop: 20 }}>
                        <SectionHeader icon="upcoming" title="Próximos Días" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {MOCK.appointments.filter(a => a.date > '2026-02-27').map(apt => (
                                <GlassCard key={apt.id} style={{ padding: 14, opacity: 0.7 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{apt.title}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {apt.date} {apt.time} • {apt.client}
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ================================================================
// PAGE: PROMOCIONES
// ================================================================
const PromotionsPage = () => (
    <div className="page-content">
        <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
            <SectionHeader icon="local_offer" title="Gestión de Promociones" right={
                <button className="btn btn-primary btn-sm"><Icon name="add" size={16} /> Nueva Promo</button>
            } />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
                {MOCK.promotions.map(p => (
                    <GlassCard key={p.id} style={{ padding: 20, borderLeft: `3px solid ${p.is_active ? 'var(--alert)' : 'var(--text-muted)'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</h4>
                            {p.is_active ? <span className="badge badge-done">Activa</span> : <span className="badge badge-canceled">Inactiva</span>}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>{p.description}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <span className="nav-badge">{p.discount_type === 'PERCENTAGE' ? `${p.discount_value}% OFF` : formatCurrency(p.discount_value) + ' OFF'}</span>
                            {p.category && <span className="nav-badge">{p.category}</span>}
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    </div>
);

// ================================================================
// PAGE: TRABAJOS DIARIOS (Mechanic View)
// ================================================================
const DailyWorkPage = () => {
    const myOrders = MOCK.workOrders.filter(wo => wo.status === 'En Box');
    return (
        <div className="page-content">
            <div className="page-grid" style={{ gridTemplateColumns: '1fr' }}>
                <SectionHeader icon="engineering" title="Mis Trabajos de Hoy" right={
                    <span className="nav-badge alert">{myOrders.length} activos</span>
                } />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {myOrders.map(wo => {
                        const client = getClient(wo.client_id);
                        const vehicle = getVehicle(wo.vehicle_id);
                        return (
                            <GlassCard key={wo.id} style={{ padding: 20 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                                    <div>
                                        <h4 style={{ fontSize: 18, fontWeight: 700 }}>OT #{wo.order_number}</h4>
                                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{vehicle?.brand} {vehicle?.model} • {vehicle?.license_plate} • {client?.first_name} {client?.last_name}</p>
                                    </div>
                                    <StatusBadge status={wo.status} />
                                </div>
                                <p style={{ fontSize: 14, marginBottom: 16 }}>{wo.description}</p>
                                <SectionHeader icon="checklist" title="Checklist Rápido" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    {MOCK.checklist_template.slice(0, 6).map(item => (
                                        <CheckItem key={item.key} label={item.label} sub={item.group} />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                    <button className="btn btn-primary" style={{ flex: 1, padding: 14, fontSize: 15 }}><Icon name="check_circle" size={20} /> Marcar Finalizado</button>
                                    <button className="btn btn-ghost" style={{ padding: 14 }}><Icon name="qr_code_scanner" size={20} /></button>
                                </div>
                            </GlassCard>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
