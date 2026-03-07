-- Agregar la columna 'category' a la tabla 'suppliers'
-- Esto permite agrupar los proveedores por rubro (Ej: Lubricantes, Repuestos, etc.)
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS category TEXT;
