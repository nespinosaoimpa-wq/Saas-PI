-- ==========================================
-- SCRIPT DE REPARACIÓN MAESTRO
-- PIRIPI PRO: OTs Multi-Mecánico y Categorías
-- Ejecuta TODO este bloque en el Editor SQL de Supabase
-- ==========================================

-- 1. Asegurar que exista la tabla de Múltiples Mecánicos
CREATE TABLE IF NOT EXISTS work_order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    mechanic_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    labor_commission_percent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en la tabla nueva
ALTER TABLE work_order_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access on assignments" ON work_order_assignments;
DROP POLICY IF EXISTS "Allow anon full access on assignments" ON work_order_assignments;
CREATE POLICY "Allow authenticated full access on assignments" ON work_order_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow anon full access on assignments" ON work_order_assignments FOR ALL TO anon USING (true);

-- 2. Asegurar que exista la columna de rentabilidad
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_profit_percent NUMERIC DEFAULT 100;

-- 3. Asegurar que exista la nueva categoría de proveedores
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS category TEXT;

-- 4. Reparar los permisos visibilidad general (por si se bloquearon accidentalmente)
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow anon read access to inventory" ON public.inventory;
CREATE POLICY "Allow authenticated full access to inventory" ON public.inventory FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow anon read access to inventory" ON public.inventory FOR SELECT TO anon USING (true);
