-- =========================================================================
-- VELOCCE PRO - MIGRACIÓN SQL PARA SOPORTE MULTI-INQUILINO (MULTI-TENANCY)
-- =========================================================================
-- Esta migración añade la columna 'company_id' a todas las tablas del negocio,
-- asociando todos los datos históricos existentes al inquilino original 'piripi'.
-- =========================================================================

BEGIN;

-- 1. Agregar columna company_id con valor por defecto 'piripi' en todas las tablas
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS vehicle_health ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS boxes ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS suppliers ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS brands ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';

-- Añadir a ambas variantes de tabla de inventario por seguridad
ALTER TABLE IF EXISTS inventory ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';

ALTER TABLE IF EXISTS stock_movements ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS work_orders ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS work_order_items ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS work_order_checklist ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';

-- Añadir a ambas variantes de tabla de cierres de caja por seguridad
ALTER TABLE IF EXISTS cash_closings ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS cash_register_closings ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';

ALTER TABLE IF EXISTS appointments ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS promotions ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS daily_work_log ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS daily_quick_services ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS service_history ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS employee_earnings ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS work_order_assignments ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS attendance_logs ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS daily_quick_service_assignments ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS client_credits ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS vehicle_notes ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS audit_logs ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';

-- 2. Asegurar que todos los registros antiguos queden explícitamente marcados como 'piripi' (incluso si el DEFAULT falló en alguna tabla heredada)
UPDATE employees SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE clients SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE vehicles SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE vehicle_health SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE boxes SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE suppliers SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE brands SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE inventory SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE inventory_items SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE stock_movements SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE work_orders SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE work_order_items SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE work_order_checklist SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE payments SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE cash_closings SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE cash_register_closings SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE appointments SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE promotions SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE daily_work_log SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE daily_quick_services SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE service_history SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE employee_earnings SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE work_order_assignments SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE attendance_logs SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE daily_quick_service_assignments SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE client_credits SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE vehicle_notes SET company_id = 'piripi' WHERE company_id IS NULL;
UPDATE audit_logs SET company_id = 'piripi' WHERE company_id IS NULL;

-- 3. Crear índices de rendimiento para búsquedas por company_id
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_company ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_company ON work_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_company ON inventory_items(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);

COMMIT;
