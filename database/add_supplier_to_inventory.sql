-- ======================================================
-- VINCULACIÓN PROVEEDOR-INVENTARIO
-- ======================================================

-- 1. Agregar columna supplier_id a inventory si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='inventory' AND column_name='supplier_id') THEN
        ALTER TABLE public.inventory ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Asegurar que los permisos incluyan la nueva columna (aunque ya deberían estar OK para MVP)
GRANT ALL ON public.inventory TO anon, authenticated, service_role;
