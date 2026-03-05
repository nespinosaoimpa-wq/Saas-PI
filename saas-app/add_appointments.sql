-- EJECUTAR ESTO EN EL SQL EDITOR DE SUPABASE PARA ACTUALIZAR LA TABLA DE TURNOS
-- Esta versión incluye las columnas correctas que espera el Calendario (title, client, vehicle, box)

-- 1. Eliminar la tabla anterior si existe para recrearla correctamente
DROP TABLE IF EXISTS appointments;

-- 2. Crear tabla de turnos con las columnas exactas de la UI
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    client TEXT NOT NULL,
    vehicle TEXT,
    box TEXT,
    color TEXT DEFAULT '#3b82f6',
    status TEXT DEFAULT 'Pendiente' CHECK (status IN ('Pendiente', 'Confirmado', 'Completado', 'Cancelado')),
    notes TEXT
);

-- 3. Habilitar RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 4. Crear política para acceso anónimo/autenticado
DROP POLICY IF EXISTS "Allow all access to authenticated anon" ON appointments;
CREATE POLICY "Allow all access to authenticated anon" ON appointments FOR ALL USING (true);
