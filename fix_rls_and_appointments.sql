-- ============================================================
-- PIRIPI PRO — Fix: RLS Policies + Appointments Table
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- 1. Crear tabla de Turnos/Citas (Appointments)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    client TEXT,
    vehicle TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL DEFAULT '09:00',
    box TEXT DEFAULT 'Box 1',
    color TEXT DEFAULT '#3b82f6',
    notes TEXT,
    status TEXT DEFAULT 'Pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Desactivar RLS en TODAS las tablas para que la app funcione
-- (Estamos usando la anon key con permisos abiertos para un MVP interno)
ALTER TABLE IF EXISTS clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS boxes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_register_closings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tire_checks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotions DISABLE ROW LEVEL SECURITY;

-- 3. Dar permisos completos al rol anon (la clave pública de Supabase)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. Recargar cache del schema
NOTIFY pgrst, 'reload schema';
