-- ==============================================================================
-- SCHEMA SUPABASE PARA SISTEMA PIRIPI PRO (Versión 3.0 - Auditada y Optimizada)
-- Fecha: 20-Marzo-2026
-- Incluye: Auditoría, Fichajes, Historial, Gomería Express y Gestión de Volumen
-- ==============================================================================

-- LIMPIEZA DE TABLAS EXISTENTES PARA EVITAR ERRORES
DROP TABLE IF EXISTS button_clicks CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS vehicle_notes CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS attendance_logs CASCADE;
DROP TABLE IF EXISTS daily_quick_services CASCADE;
DROP TABLE IF EXISTS work_order_assignments CASCADE;
DROP TABLE IF EXISTS work_order_items CASCADE;
DROP TABLE IF EXISTS cash_closings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS boxes CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- 1. TABLA DE EMPLEADOS
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'cajero', 'mecanico', 'gomero')),
    pin TEXT NOT NULL CHECK (length(pin) = 4),
    commission_rate NUMERIC(5,2) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT true
);

-- 2. TABLA DE CLIENTES
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    dni TEXT,
    address TEXT,
    is_frequent BOOLEAN DEFAULT false
);

-- 3. TABLA DE VEHÍCULOS
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    license_plate TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    km INTEGER DEFAULT 0,
    difficulty_factor NUMERIC(3,2) DEFAULT 1.0,
    color TEXT,
    health_score INTEGER DEFAULT 100
);

-- 4. TABLA DE INVENTARIO
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    barcode TEXT UNIQUE,
    short_code TEXT,
    brand TEXT,
    supplier TEXT,
    stock_type TEXT NOT NULL CHECK (stock_type IN ('UNIT', 'VOLUME')),
    stock_quantity INTEGER DEFAULT 0,
    stock_min INTEGER DEFAULT 0,
    stock_ml INTEGER DEFAULT 0,
    stock_min_ml INTEGER DEFAULT 0,
    container_size_ml INTEGER,
    cost_price NUMERIC(10,2) DEFAULT 0.0,
    sell_price NUMERIC(10,2) DEFAULT 0.0,
    sell_price_per_ml NUMERIC(10,2) DEFAULT 0.0
);

-- 5. TABLA DE PROVEEDORES
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    cuit TEXT,
    email TEXT
);

-- 6. TABLA DE BOXES
CREATE TABLE boxes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('MECANICA', 'GOMERIA')),
    is_active BOOLEAN DEFAULT true
);

-- 7. TABLA DE ÓRDENES DE TRABAJO (OTs)
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    order_number SERIAL,
    client_id UUID REFERENCES clients(id),
    vehicle_id UUID REFERENCES vehicles(id),
    box_id TEXT REFERENCES boxes(id),
    mechanic_id UUID REFERENCES employees(id), -- Principal (obsoleto si se usan assignments, pero se mantiene por compatibilidad)
    status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Box', 'Finalizado', 'Cobrado', 'Cancelado')),
    description TEXT,
    mechanic_notes TEXT,
    km_at_entry INTEGER,
    labor_cost NUMERIC(10,2) DEFAULT 0.0,
    parts_cost NUMERIC(10,2) DEFAULT 0.0,
    applied_commission_rate NUMERIC(5,2) DEFAULT 0.0,
    total_price NUMERIC(10,2) DEFAULT 0.0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. TABLA DE ITEMS DE ORDEN DE TRABAJO
CREATE TABLE work_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory(id),
    description TEXT,
    quantity NUMERIC(10,2) DEFAULT 1.0,
    unit_price NUMERIC(10,2) DEFAULT 0.0,
    total_price NUMERIC(10,2) DEFAULT 0.0,
    is_labor BOOLEAN DEFAULT false
);

-- 9. ASIGNACIONES DE TRABAJO (Multi-mecánico)
CREATE TABLE work_order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    mechanic_id UUID REFERENCES employees(id),
    labor_commission_percent NUMERIC(5,2) DEFAULT 0.0
);

-- 10. TABLA DE PAGOS Y MOVIMIENTOS DE CAJA
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('EFECTIVO', 'TARJETA', 'DEBITO', 'CREDITO', 'TRANSFERENCIA', 'COMBINADO')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference TEXT,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('VENTA', 'OT', 'EGRESO', 'GOMERIA', 'INGRESO')),
    employee_id UUID REFERENCES employees(id),
    cashier_profit_amount NUMERIC(10,2) DEFAULT 0.0,
    cash_closing_id UUID, -- Se asigna al cerrar la caja
    cae TEXT,
    cae_due_date DATE,
    receipt_number TEXT
);

-- 11. TABLA DE CIERRES DE CAJA
CREATE TABLE cash_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    employee_id UUID REFERENCES employees(id),
    starting_balance NUMERIC(10,2) DEFAULT 0.0,
    cash_income NUMERIC(10,2) DEFAULT 0.0,
    transfer_income NUMERIC(10,2) DEFAULT 0.0,
    card_income NUMERIC(10,2) DEFAULT 0.0,
    withdrawals NUMERIC(10,2) DEFAULT 0.0,
    expected_cash NUMERIC(10,2) DEFAULT 0.0,
    actual_cash NUMERIC(10,2) DEFAULT 0.0,
    difference NUMERIC(10,2) DEFAULT 0.0,
    notes TEXT
);

-- 12. SERVICIOS RÁPIDOS (Gomería Express)
CREATE TABLE daily_quick_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    service_type TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    mechanic_id UUID REFERENCES employees(id),
    client_id UUID REFERENCES clients(id),
    vehicle_id UUID REFERENCES vehicles(id),
    notes TEXT
);

-- 13. FICHAJE DE PERSONAL
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id),
    employee_name TEXT,
    type TEXT CHECK (type IN ('IN', 'OUT')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    time_display TEXT
);

-- 14. CALENDARIO DE TURNOS
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    client_name TEXT NOT NULL,
    vehicle_info TEXT,
    service TEXT,
    status TEXT DEFAULT 'Pendiente',
    notes TEXT
);

-- 15. PROMOCIONES Y CUPONES
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    discount_percent NUMERIC(5,2) DEFAULT 0.0,
    valid_until DATE,
    coupon_code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true
);

-- 16. NOTAS DE VEHÍCULOS
CREATE TABLE vehicle_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id),
    note TEXT NOT NULL
);

-- 17. AUDITORÍA (Solo Programador)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    employee_id UUID REFERENCES employees(id),
    action TEXT NOT NULL,
    details JSONB,
    path TEXT
);

-- 18. MAPA DE CALOR (Métricas de Clicks)
CREATE TABLE button_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    page TEXT NOT NULL,
    button_id TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    employee_id UUID REFERENCES employees(id),
    UNIQUE(page, button_id)
);

-- ==========================================
-- Habilitar Row Level Security (RLS)
-- ==========================================
DO $$ 
DECLARE 
    t TEXT;
BEGIN 
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(t) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- Política General Simplificada (Permitir todo a autenticados mientras se desarrolla)
-- En producción se recomienda restringir por rol.
DO $$ 
DECLARE 
    t TEXT;
BEGIN 
    FOR t IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') LOOP
        EXECUTE 'CREATE POLICY "Access All" ON ' || quote_ident(t) || ' FOR ALL USING (true);';
    END LOOP;
END $$;

-- ==========================================
-- INSERTAR DATOS SEMILLA BÁSICOS
-- ==========================================

-- 1 Administrador para primer ingreso
INSERT INTO employees (name, role, pin, commission_rate) VALUES
  ('Administrador', 'admin', '1234', 0);

-- Definiendo los 4 boxes como pediste
INSERT INTO boxes (id, name, type) VALUES
  ('b1', 'Box 1', 'MECANICA'),
  ('b2', 'Box 2', 'MECANICA'),
  ('b3', 'Box 3', 'MECANICA'),
  ('b4', 'Gomería Express', 'GOMERIA');
