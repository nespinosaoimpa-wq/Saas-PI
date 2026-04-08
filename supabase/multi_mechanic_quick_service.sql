-- ==============================================================================
-- SOPORTE PARA MÚLTIPLES MECÁNICOS EN GOMERÍA EXPRESS
-- ==============================================================================

-- 1. Crear tabla de asignaciones para servicios rápidos
CREATE TABLE IF NOT EXISTS daily_quick_service_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    quick_service_id UUID REFERENCES daily_quick_services(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id)
);

-- 2. Habilitar RLS
ALTER TABLE daily_quick_service_assignments ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de acceso (Total para anon/autenticado por simplicidad del MVP actual)
DROP POLICY IF EXISTS "Allow all access to authenticated anon" ON daily_quick_service_assignments;
CREATE POLICY "Allow all access to authenticated anon" ON daily_quick_service_assignments FOR ALL USING (true);

-- 4. Notificar al canal RealTime
ALTER PUBLICATION supabase_realtime ADD TABLE daily_quick_service_assignments;
