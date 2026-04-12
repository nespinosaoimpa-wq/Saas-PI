-- ======================================================
-- CREACIÓN Y REGULARIZACIÓN DE TABLA DE GANANCIAS
-- ======================================================

-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.employee_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id),
    amount_earned NUMERIC(10,2) NOT NULL,
    description TEXT,
    quick_service_id UUID REFERENCES public.daily_quick_services(id),
    work_order_id UUID REFERENCES public.work_orders(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Asegurar que description sea TEXT (por si ya existía como VARCHAR)
ALTER TABLE public.employee_earnings ALTER COLUMN description TYPE TEXT;

-- 3. Habilitar permisos (asumiendo que RLS está deshabilitado como el resto del MVP)
GRANT ALL ON public.employee_earnings TO anon;
GRANT ALL ON public.employee_earnings TO authenticated;
GRANT ALL ON public.employee_earnings TO service_role;
