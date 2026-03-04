// ============================================================
// SAAS PIRIPI PRO — Mock Data & State Management
// ============================================================

export const MOCK = {
  currentUser: null,
  boxes: [],
  clients: [],
  vehicles: [],
  inventory: [],
  workOrders: [],
  payments: [],
  appointments: [],
  promotions: [],
  revenue: {
    daily: [],
    weekly_total: 0,
    monthly_total: 0,
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
  suppliers: [],
};

// Helper functions exported for use across pages
export const formatCurrency = (n) => '$' + (n || 0).toLocaleString('es-AR');
export const formatML = (ml) => ml >= 1000 ? (ml / 1000).toFixed(1) + 'L' : ml + 'ml';
export const getHealthColor = (score) => score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
export const getStatusBadge = (status) => {
  const map = { 'Pendiente': 'badge-pending', 'En Box': 'badge-active', 'Finalizado': 'badge-done', 'Cancelado': 'badge-canceled', 'Programado': 'badge-pending', 'Confirmado': 'badge-active', 'En Curso': 'badge-active', 'Completado': 'badge-done' };
  return map[status] || 'badge-pending';
};
