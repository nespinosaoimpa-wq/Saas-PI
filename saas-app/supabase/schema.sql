-- ==============================================================================
-- SCHEMA SUPABASE PARA SISTEMA PIRIPI PRO (V2 - Lógica de Negocio Refinada)
-- Incluye separación de caja (mano obra vs repuestos) y boxes específicos
-- ==============================================================================

-- LIMPIEZA DE TABLAS EXISTENTES PARA EVITAR ERRORES
DROP TABLE IF EXISTS cash_closings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS vehicle_notes CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS boxes CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- 1. TABLA DE EMPLEADOS (Usuarios del sistema)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
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
    cuit TEXT
);

-- 6. TABLA DE BOXES (Gestión de los espacios físicos)
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
    mechanic_id UUID REFERENCES employees(id),
    status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'En Box', 'Finalizado', 'Cobrado', 'Cancelado')),
    description TEXT,
    km_at_entry INTEGER,
    
    -- Separación estricta para cálculo de comisiones
    labor_cost NUMERIC(10,2) DEFAULT 0.0, -- Costo de Mano de Obra (base para la comisión)
    parts_cost NUMERIC(10,2) DEFAULT 0.0, -- Costo de Repuestos (sin comisión)
    applied_commission_rate NUMERIC(5,2) DEFAULT 0.0, -- Porcentaje de comisión regalado al mecánico en ESTA OT
    total_price NUMERIC(10,2) DEFAULT 0.0, -- Total siempre será labor_cost + parts_cost
    
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 8. TABLA DE NOTAS MANUALES DEL VEHÍCULO (Historial manual)
CREATE TABLE vehicle_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    km INTEGER,
    cost NUMERIC(10,2) DEFAULT 0.0,
    technician TEXT,
    note_type TEXT DEFAULT 'MANUAL' CHECK (note_type IN ('MANUAL', 'SERVICE'))
);

-- 9. TABLA DE PAGOS Y MOVIMIENTOS DE CAJA
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    work_order_id UUID REFERENCES work_orders(id),
    amount NUMERIC(10,2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference TEXT,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('VENTA', 'OT', 'EGRESO', 'GOMERIA', 'INGRESO')),
    employee_id UUID REFERENCES employees(id)
);

-- 9. TABLA DE CIERRES DE CAJA
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

-- ==========================================
-- Habilitar Row Level Security (RLS)
-- ==========================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to authenticated anon" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON vehicles FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON inventory FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON suppliers FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON boxes FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON work_orders FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON vehicle_notes FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON cash_closings FOR ALL USING (true);

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
