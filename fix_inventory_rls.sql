-- Fix temporal para asegurar que el inventario sea visible
-- Habilitar RLS si no estaba habilitado
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Borrar cualquier policy antigua que pueda estar bloqueando
DROP POLICY IF EXISTS "Allow authenticated full access to inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow anon read access to inventory" ON public.inventory;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.inventory;

-- Crear nuevas policies limpias
-- Los administradores (authenticated) pueden gestionar
CREATE POLICY "Allow authenticated full access to inventory" ON public.inventory FOR ALL TO authenticated USING (true);

-- Todos (anon) pueden leer para Populate y vistas
CREATE POLICY "Allow anon read access to inventory" ON public.inventory FOR SELECT TO anon USING (true);
