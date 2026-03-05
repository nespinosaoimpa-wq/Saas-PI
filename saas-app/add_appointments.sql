-- EJECUTAR ESTO EN EL SQL EDITOR DE SUPABASE PARA AGREGAR LA TABLA FALTANTE

-- 1. Crear tabla de turnos si no existe
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    client_name TEXT NOT NULL,
    vehicle_info TEXT,
    service_type TEXT NOT NULL,
    status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Confirmado', 'Completado', 'Cancelado')),
    notes TEXT
);

-- 2. Habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para acceso anónimo/autenticado
DROP POLICY IF EXISTS "Allow all access to authenticated anon" ON appointments;
CREATE POLICY "Allow all access to authenticated anon" ON appointments FOR ALL USING (true);
