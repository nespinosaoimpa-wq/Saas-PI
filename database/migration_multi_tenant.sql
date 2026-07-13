-- =========================================================================
-- VELOCCE PRO - MIGRACIÓN SQL PARA SOPORTE MULTI-INQUILINO (MULTI-TENANCY)
-- Versión Dinámica e Idempotente (Segura ante tablas inexistentes)
-- =========================================================================

BEGIN;

-- 1. Agregar columna company_id con valor por defecto 'piripi' (Solo si la tabla existe)
ALTER TABLE IF EXISTS employees ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS clients ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS vehicle_health ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS boxes ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS suppliers ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS brands ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS inventory ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS inventory_items ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS stock_movements ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS work_orders ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS work_order_items ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS work_order_checklist ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
ALTER TABLE IF EXISTS payments ADD COLUMN IF NOT EXISTS company_id TEXT DEFAULT 'piripi';
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

-- 2. Actualizar registros nulos de manera dinámica (Previene errores si una tabla no existe en la base de datos)
DO $$
DECLARE
    t_name TEXT;
    tables_to_update TEXT[] := ARRAY[
        'employees', 'clients', 'vehicles', 'vehicle_health', 'boxes', 'suppliers', 'brands',
        'inventory', 'inventory_items', 'stock_movements', 'work_orders', 'work_order_items',
        'work_order_checklist', 'payments', 'cash_closings', 'cash_register_closings',
        'appointments', 'promotions', 'daily_work_log', 'daily_quick_services', 'service_history',
        'employee_earnings', 'work_order_assignments', 'attendance_logs', 'daily_quick_service_assignments',
        'client_credits', 'vehicle_notes', 'audit_logs'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_to_update LOOP
        -- Verificar si la tabla existe en el esquema público
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = t_name
        ) THEN
            -- Ejecutar actualización dinámica
            EXECUTE format('UPDATE %I SET company_id = %L WHERE company_id IS NULL', t_name, 'piripi');
            RAISE NOTICE 'Tabla % actualizada con éxito.', t_name;
        ELSE
            RAISE NOTICE 'Tabla % omitida (no existe en la base de datos).', t_name;
        END IF;
    END LOOP;
END $$;

-- 3. Crear índices de rendimiento dinámicamente para las tablas existentes
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employees') THEN
        CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
        CREATE INDEX IF NOT EXISTS idx_vehicles_company ON vehicles(company_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'work_orders') THEN
        CREATE INDEX IF NOT EXISTS idx_work_orders_company ON work_orders(company_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory') THEN
        CREATE INDEX IF NOT EXISTS idx_inventory_company ON inventory(company_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_items') THEN
        CREATE INDEX IF NOT EXISTS idx_inventory_items_company ON inventory_items(company_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        CREATE INDEX IF NOT EXISTS idx_payments_company ON payments(company_id);
    END IF;
END $$;

COMMIT;
