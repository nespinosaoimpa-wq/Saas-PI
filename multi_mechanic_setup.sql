-- Tabla intermedia para múltiples mecánicos en una orden de trabajo
CREATE TABLE IF NOT EXISTS work_order_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    mechanic_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    labor_commission_percent NUMERIC DEFAULT 0, -- Comisión específica para este mecánico en esta OT
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE work_order_assignments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para work_order_assignments
CREATE POLICY "Allow authenticated full access on assignments" ON work_order_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow anon full access on assignments" ON work_order_assignments FOR ALL TO anon USING (true);

-- Agregar campos de rentabilidad a la tabla work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_profit_percent NUMERIC DEFAULT 100;

-- Función para obtener productividad (Ejemplo de uso en reportes)
-- Esta se usará desde el frontend vía RCP o consultas directas a las tablas vinculadas
