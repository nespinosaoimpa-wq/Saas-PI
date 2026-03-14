// ============================================================
// SAAS PIRIPI PRO — Mock Data & State Management
// ============================================================

export const MOCK = {
  currentUser: { id: '1', name: 'Carlos Admin', role: 'admin', avatar: null, commission_rate: 15.0 },

  boxes: [
    { id: 'b1', name: 'Box 1', status: 'Ocupado', mechanic: 'Miguel Torres' },
    { id: 'b2', name: 'Box 2', status: 'Ocupado', mechanic: 'Pablo Ruiz' },
    { id: 'b3', name: 'Box 3', status: 'Libre', mechanic: null },
    { id: 'b4', name: 'Box 4', status: 'Libre', mechanic: null },
  ],
  employees: [
    { id: 'e1', name: 'Miguel Torres', pin: '1234', role: 'mechanic' },
    { id: 'e2', name: 'Pablo Ruiz', pin: '5678', role: 'mechanic' },
    { id: 'e3', name: 'Carlos Admin', pin: '0000', role: 'admin' },
  ],

  clients: [
    { id: 'c1', first_name: 'Juan', last_name: 'Pérez', phone: '11-2345-6789', email: 'juan@mail.com', dni: '30456789', is_frequent: true, vehicles: ['v1', 'v2'] },
    { id: 'c2', first_name: 'María', last_name: 'González', phone: '11-3456-7890', email: 'maria@mail.com', dni: '28123456', is_frequent: true, vehicles: ['v3'] },
    { id: 'c3', first_name: 'Roberto', last_name: 'Sánchez', phone: '11-4567-8901', email: 'rober@mail.com', dni: '35678901', is_frequent: false, vehicles: ['v4'] },
    { id: 'c4', first_name: 'Ana', last_name: 'Martínez', phone: '11-5678-9012', email: 'ana@mail.com', dni: '32456123', is_frequent: false, vehicles: ['v5'] },
    { id: 'c5', first_name: 'Luis', last_name: 'Fernández', phone: '11-6789-0123', email: 'luis@mail.com', dni: '29876543', is_frequent: true, vehicles: ['v6', 'v7'] },
  ],

  vehicles: [
    {
      id: 'v1', client_id: 'c1', license_plate: 'AB 123 CD', brand: 'Toyota', model: 'Corolla', year: 2020, km: 45000, difficulty_factor: 1.0, color: 'Gris', health_score: 85,
      history: [
        { id: 'h1', date: '2026-01-15', description: 'Cambio de aceite y filtro (YPF Elaion 5W-30)', km: 40000, price: 18500, technician: 'Miguel Torres' },
        { id: 'h2', date: '2025-08-10', description: 'Revisión de frenos y niveles', km: 35000, price: 5000, technician: 'Pablo Ruiz' }
      ]
    },
    {
      id: 'v2', client_id: 'c1', license_plate: 'EF 456 GH', brand: 'Ford', model: 'Ranger', year: 2018, km: 98000, difficulty_factor: 1.5, color: 'Negro', health_score: 62,
      history: [
        { id: 'h3', date: '2025-11-20', description: 'Cambio de cubiertas delanteras (Pirelli P7)', km: 90000, price: 250000, technician: 'Miguel Torres' }
      ]
    },
    { id: 'v3', client_id: 'c2', license_plate: 'IJ 789 KL', brand: 'Chevrolet', model: 'Cruze', year: 2021, km: 32000, difficulty_factor: 1.0, color: 'Blanco', health_score: 92, history: [] },
    { id: 'v4', client_id: 'c3', license_plate: 'MN 012 OP', brand: 'Volkswagen', model: 'Amarok', year: 2019, km: 120000, difficulty_factor: 1.8, color: 'Plata', health_score: 45, history: [] },
    { id: 'v5', client_id: 'c4', license_plate: 'QR 345 ST', brand: 'Fiat', model: 'Cronos', year: 2022, km: 18000, difficulty_factor: 1.0, color: 'Rojo', health_score: 95, history: [] },
    { id: 'v6', client_id: 'c5', license_plate: 'UV 678 WX', brand: 'Renault', model: 'Duster', year: 2020, km: 67000, difficulty_factor: 1.2, color: 'Azul', health_score: 78, history: [] },
    { id: 'v7', client_id: 'c5', license_plate: 'YZ 901 AB', brand: 'Peugeot', model: '208', year: 2023, km: 8000, difficulty_factor: 1.0, color: 'Blanco', health_score: 98, history: [] },
  ],

  inventory: [
    { id: 'i1', name: 'Aceite YPF Elaion F50 5W-30', category: 'Aceite Motor', barcode: '7790074003123', brand: 'YPF', supplier: 'Distribuidora Sur', stock_type: 'VOLUME', stock_ml: 38500, stock_min_ml: 20000, container_size_ml: 4000, cost_price: 8500, sell_price: 3800, sell_price_per_ml: 3.8 },
    { id: 'i2', name: 'Aceite Shell Helix HX7 10W-40', category: 'Aceite Motor', barcode: '7790074003456', brand: 'Shell', supplier: 'Distribuidora Sur', stock_type: 'VOLUME', stock_ml: 15200, stock_min_ml: 20000, container_size_ml: 4000, cost_price: 9200, sell_price: 4200, sell_price_per_ml: 4.2 },
    { id: 'i3', name: 'Aceite Castrol EDGE 5W-40', category: 'Aceite Motor', barcode: '7790074003789', brand: 'Castrol', supplier: 'Importadora Norte', stock_type: 'VOLUME', stock_ml: 52000, stock_min_ml: 20000, container_size_ml: 4000, cost_price: 12000, sell_price: 5500, sell_price_per_ml: 5.5 },
    { id: 'i4', name: 'Filtro Aceite Mann W712/95', category: 'Filtro Aceite', barcode: '4011558035600', brand: 'Mann Filter', supplier: 'Importadora Norte', stock_type: 'UNIT', stock_quantity: 24, stock_min: 5, cost_price: 3200, sell_price: 5800 },
    { id: 'i5', name: 'Filtro Aceite Bosch P3219', category: 'Filtro Aceite', barcode: '4011558035617', brand: 'Bosch', supplier: 'Distribuidora Sur', stock_type: 'UNIT', stock_quantity: 18, stock_min: 5, cost_price: 2800, sell_price: 4900 },
    { id: 'i6', name: 'Filtro Aire Mann C27006', category: 'Filtro Aire', barcode: '4011558035624', brand: 'Mann Filter', supplier: 'Importadora Norte', stock_type: 'UNIT', stock_quantity: 12, stock_min: 5, cost_price: 4500, sell_price: 7200 },
    { id: 'i7', name: 'Pastillas Freno Bosch Del.', category: 'Pastillas Freno', barcode: '4011558035631', brand: 'Bosch', supplier: 'Distribuidora Sur', stock_type: 'UNIT', stock_quantity: 8, stock_min: 4, cost_price: 8900, sell_price: 14500 },
    { id: 'i8', name: 'Pastillas Freno Bosch Tras.', category: 'Pastillas Freno', barcode: '4011558035648', brand: 'Bosch', supplier: 'Distribuidora Sur', stock_type: 'UNIT', stock_quantity: 3, stock_min: 4, cost_price: 7600, sell_price: 12800 },
    { id: 'i9', name: 'Bujía NGK BKR6E', category: 'Bujías', barcode: '4011558035655', brand: 'NGK', supplier: 'Importadora Norte', stock_type: 'UNIT', stock_quantity: 32, stock_min: 10, cost_price: 1800, sell_price: 3200 },
    { id: 'i10', name: 'Refrigerante Prestone 50/50', category: 'Refrigerante', barcode: '7790074003999', brand: 'Prestone', supplier: 'Distribuidora Sur', stock_type: 'VOLUME', stock_ml: 28000, stock_min_ml: 10000, container_size_ml: 5000, cost_price: 4200, sell_price: 1200, sell_price_per_ml: 1.2 },
    { id: 'i11', name: 'Cubierta Pirelli P7 205/55 R16', category: 'Cubiertas', barcode: '8019227234893', brand: 'Pirelli', supplier: 'Neumáticos Express', stock_type: 'UNIT', stock_quantity: 6, stock_min: 4, cost_price: 85000, sell_price: 125000 },
    { id: 'i12', name: 'Líquido de Frenos DOT4', category: 'Líquido Frenos', barcode: '7790074004001', brand: 'Bardahl', supplier: 'Distribuidora Sur', stock_type: 'VOLUME', stock_ml: 8500, stock_min_ml: 5000, container_size_ml: 1000, cost_price: 3500, sell_price: 2200, sell_price_per_ml: 2.2 },
  ],

  workOrders: [
    { id: 'wo1', order_number: 1045, client_id: 'c1', vehicle_id: 'v1', box_id: 'b1', mechanic: 'Miguel Torres', status: 'En Box', description: 'Cambio aceite + filtro', km_at_entry: 45000, total_price: 18500, created_at: '2026-02-27T08:30:00', started_at: '2026-02-27T09:00:00' },
    { id: 'wo2', order_number: 1046, client_id: 'c2', vehicle_id: 'v3', box_id: 'b2', mechanic: 'Pablo Ruiz', status: 'En Box', description: 'Cambio pastillas delanteras + revisión frenos', km_at_entry: 32000, total_price: 35200, created_at: '2026-02-27T09:15:00', started_at: '2026-02-27T09:30:00' },
    { id: 'wo3', order_number: 1047, client_id: 'c3', vehicle_id: 'v4', box_id: null, mechanic: null, status: 'Pendiente', description: 'Service completo 120.000km', km_at_entry: 120000, total_price: 0, created_at: '2026-02-27T10:00:00' },
    { id: 'wo4', order_number: 1044, client_id: 'c5', vehicle_id: 'v6', box_id: 'b1', mechanic: 'Miguel Torres', status: 'Finalizado', description: 'Cambio cubiertas x4 + alineación', km_at_entry: 67000, total_price: 520000, created_at: '2026-02-26T14:00:00', completed_at: '2026-02-26T17:30:00' },
    { id: 'wo5', order_number: 1043, client_id: 'c4', vehicle_id: 'v5', box_id: 'b3', mechanic: 'Pablo Ruiz', status: 'Finalizado', description: 'Cambio aceite + filtro aire', km_at_entry: 18000, total_price: 22400, created_at: '2026-02-26T10:00:00', completed_at: '2026-02-26T11:45:00' },
  ],

  payments: [
    { id: 'p1', work_order_id: 'wo4', amount: 520000, method: 'TARJETA', date: '2026-02-26', reference: 'VISA ***4521' },
    { id: 'p2', work_order_id: 'wo5', amount: 22400, method: 'EFECTIVO', date: '2026-02-26', reference: null },
    { id: 'p3', work_order_id: null, amount: 15000, method: 'TRANSFERENCIA', date: '2026-02-27', reference: 'CBU transferencia' },
    { id: 'p4', work_order_id: null, amount: 8500, method: 'EFECTIVO', date: '2026-02-27', reference: null },
    { id: 'p5', work_order_id: null, amount: 35200, method: 'TARJETA', date: '2026-02-25', reference: 'MC ***7832' },
    { id: 'p6', work_order_id: null, amount: 18200, method: 'EFECTIVO', date: '2026-02-25', reference: null },
    { id: 'p7', work_order_id: null, amount: 42000, method: 'TRANSFERENCIA', date: '2026-02-24', reference: 'MP' },
    { id: 'p8', work_order_id: null, amount: 95000, method: 'TARJETA', date: '2026-02-24', reference: 'VISA ***1234' },
  ],

  appointments: [
    { id: 'a1', client: 'Juan Pérez', vehicle: 'Toyota Corolla', title: 'Service 45.000km', date: '2026-02-27', time: '08:30', box: 'Box 1', status: 'En Curso', color: '#3b82f6' },
    { id: 'a2', client: 'María González', vehicle: 'Chevrolet Cruze', title: 'Cambio pastillas', date: '2026-02-27', time: '09:15', box: 'Box 2', status: 'En Curso', color: '#3b82f6' },
    { id: 'a3', client: 'Roberto Sánchez', vehicle: 'VW Amarok', title: 'Service completo', date: '2026-02-27', time: '11:00', box: 'Box 3', status: 'Programado', color: '#22c55e' },
    { id: 'a4', client: 'Ana Martínez', vehicle: 'Fiat Cronos', title: 'Cambio cubiertas', date: '2026-02-28', time: '09:00', box: 'Box 4', status: 'Confirmado', color: '#8b5cf6' },
    { id: 'a5', client: 'Luis Fernández', vehicle: 'Peugeot 208', title: 'Revisión general', date: '2026-02-28', time: '14:00', box: 'Box 1', status: 'Programado', color: '#f59e0b' },
  ],

  promotions: [
    { id: 'pr1', name: 'Combo Aceite + Filtro', description: '10% OFF en cambio de aceite con filtro incluido', discount_type: 'PERCENTAGE', discount_value: 10, is_active: true, category: 'Aceite Motor' },
    { id: 'pr2', name: 'Promo Cubiertas x4', description: 'Llevá 4 cubiertas y la alineación es GRATIS', discount_type: 'FIXED', discount_value: 8500, is_active: true, category: 'Cubiertas' },
    { id: 'pr3', name: 'Service Premium', description: '15% OFF en service completo para clientes frecuentes', discount_type: 'PERCENTAGE', discount_value: 15, is_active: true, category: null },
  ],

  revenue: {
    daily: [
      { day: 'Lun', cash: 45000, transfer: 32000, card: 18000 },
      { day: 'Mar', cash: 62000, transfer: 28000, card: 35000 },
      { day: 'Mié', cash: 38000, transfer: 45000, card: 22000 },
      { day: 'Jue', cash: 55000, transfer: 38000, card: 42000 },
      { day: 'Vie', cash: 72000, transfer: 52000, card: 38000 },
    ],
    weekly_total: 642000,
    monthly_total: 2850000,
  },

  checklist_template: [
    { key: 'luces_del', label: 'Luces delanteras', group: 'Luces' },
    { key: 'luces_tra', label: 'Luces traseras', group: 'Luces' },
    { key: 'luces_giro', label: 'Luces de giro', group: 'Luces' },
    { key: 'nivel_aceite', label: 'Nivel de aceite', group: 'Niveles' },
    { key: 'nivel_refrig', label: 'Nivel refrigerante', group: 'Niveles' },
    { key: 'nivel_frenos', label: 'Líquido de frenos', group: 'Niveles' },
    { key: 'presion_neum', label: 'Presión neumáticos', group: 'Neumáticos' },
    { key: 'estado_neum', label: 'Estado neumáticos', group: 'Neumáticos' },
    { key: 'freno_mano', label: 'Freno de mano', group: 'Frenos' },
    { key: 'limpia', label: 'Limpiaparabrisas', group: 'Otros' },
    { key: 'bateria', label: 'Batería', group: 'Otros' },
    { key: 'correas', label: 'Correas', group: 'Otros' },
  ],

  suppliers: [
    { id: 's1', name: 'Distribuidora Sur', contact: 'Pedro López', phone: '11-1234-5678', cuit: '30-12345678-9' },
    { id: 's2', name: 'Importadora Norte', contact: 'Laura Díaz', phone: '11-2345-6789', cuit: '30-98765432-1' },
    { id: 's3', name: 'Neumáticos Express', contact: 'Martín Ríos', phone: '11-3456-7890', cuit: '30-45678901-2' },
  ],
};

// Helper functions exported for use across pages
export const formatCurrency = (n) => '$' + (n || 0).toLocaleString('es-AR');
export const formatML = (ml) => {
  if (ml === undefined || ml === null) return '0ml';
  return ml >= 1000 ? (ml / 1000).toFixed(1) + 'L' : ml + 'ml';
};
export const getHealthColor = (score) => score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
export const getStatusBadge = (status) => {
  const map = { 'Pendiente': 'badge-pending', 'En Box': 'badge-active', 'Finalizado': 'badge-done', 'Cancelado': 'badge-canceled', 'Programado': 'badge-pending', 'Confirmado': 'badge-active', 'En Curso': 'badge-active', 'Completado': 'badge-done' };
  return map[status] || 'badge-pending';
};
