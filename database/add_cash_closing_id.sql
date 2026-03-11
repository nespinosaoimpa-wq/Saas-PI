-- ============================================================
-- Agregar columna cash_closing_id a payments
-- Permite vincular pagos a un cierre de caja específico.
-- Los pagos con cash_closing_id != NULL pertenecen a un turno cerrado.
-- Los pagos con cash_closing_id = NULL son del turno actual (abierto).
-- ============================================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS cash_closing_id UUID REFERENCES cash_closings(id) ON DELETE SET NULL;

-- Índice para filtrar rápidamente los pagos del turno actual
CREATE INDEX IF NOT EXISTS idx_payments_cash_closing ON payments(cash_closing_id);
