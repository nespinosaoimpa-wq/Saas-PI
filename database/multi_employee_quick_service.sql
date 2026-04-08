-- Tabla para registrar múltiples empleados en servicios rápidos (Gomería/Express)
CREATE TABLE IF NOT EXISTS quick_service_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quick_service_id UUID REFERENCES daily_quick_services(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    commission_amount NUMERIC(12,2) DEFAULT 0, -- Monto exacto que se le asignó como ganancia
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS si es necesario (el usuario suele tener RLS deshabilitado en su MVP, pero por seguridad lo incluimos)
ALTER TABLE quick_service_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for authenticated" ON quick_service_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for anon" ON quick_service_assignments FOR ALL TO anon USING (true);
