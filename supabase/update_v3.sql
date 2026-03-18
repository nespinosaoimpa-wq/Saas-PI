-- ==============================================================================
-- ACTUALIZACIÓN SUPABASE PARA SISTEMA PIRIPI PRO (MÚLTIPLES MECÁNICOS Y CAJEROS)
-- ==============================================================================

-- 1. Actualizar tabla WORK_ORDERS si falta labor_profit_percent
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_profit_percent NUMERIC(5,2) DEFAULT 100.0;

-- 2. Actualizar tabla PAYMENTS para guardar la ganancia del cajero
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cashier_profit_amount NUMERIC(10,2) DEFAULT 0.0;

-- 3. Crear tabla WORK_ORDER_ASSIGNMENTS para múltiples mecánicos por orden
CREATE TABLE IF NOT EXISTS work_order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    mechanic_id UUID REFERENCES employees(id),
    labor_commission_percent NUMERIC(5,2) DEFAULT 0.0
);

-- 4. Crear tabla WORK_ORDER_ITEMS para repuestos y cobros extra de la OT
CREATE TABLE IF NOT EXISTS work_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory(id),
    description TEXT NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1.0,
    unit_price NUMERIC(10,2) DEFAULT 0.0,
    total_price NUMERIC(10,2) DEFAULT 0.0,
    is_labor BOOLEAN DEFAULT false
);

-- 5. Crear tabla DAILY_QUICK_SERVICES para el Módulo Express
CREATE TABLE IF NOT EXISTS daily_quick_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    service_type TEXT NOT NULL,
    price NUMERIC(10,2) DEFAULT 0.0,
    mechanic_id UUID REFERENCES employees(id),
    client_id UUID REFERENCES clients(id),
    vehicle_id UUID REFERENCES vehicles(id),
    notes TEXT
);

-- 6. Crear tabla ATTENDANCE_LOGS para el Fichaje de Personal
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    employee_id UUID REFERENCES employees(id),
    employee_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
    time_display TEXT
);

-- Habilitar Políticas (RLS) para las nuevas tablas
ALTER TABLE work_order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quick_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to authenticated anon" ON work_order_assignments FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON work_order_items FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON daily_quick_services FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon" ON attendance_logs FOR ALL USING (true);

-- Notificar al canal RealTime para mantener TODO sincronizado
ALTER PUBLICATION supabase_realtime ADD TABLE work_orders, work_order_assignments, work_order_items, payments, employees, inventory;
