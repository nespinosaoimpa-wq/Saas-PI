-- ======================================================
-- PROVISIÓN DE TABLAS DE COMISIONES Y GOMERÍA
-- ======================================================

-- 1. Tabla de Servicios Rápidos (Gomería)
CREATE TABLE IF NOT EXISTS public.daily_quick_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT,
    price NUMERIC(10,2) DEFAULT 0,
    mechanic_id UUID REFERENCES public.employees(id),
    client_id UUID REFERENCES public.clients(id),
    vehicle_id UUID REFERENCES public.vehicles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Asignaciones de Gomería (Multi-mecánico)
CREATE TABLE IF NOT EXISTS public.daily_quick_service_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quick_service_id UUID REFERENCES public.daily_quick_services(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabla de Ganancias / Comisiones (Centralizada)
CREATE TABLE IF NOT EXISTS public.employee_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id),
    amount_earned NUMERIC(10,2) NOT NULL,
    description TEXT,
    quick_service_id UUID REFERENCES public.daily_quick_services(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Permisos (MVP)
GRANT ALL ON public.daily_quick_services TO anon, authenticated, service_role;
GRANT ALL ON public.daily_quick_service_assignments TO anon, authenticated, service_role;
GRANT ALL ON public.employee_earnings TO anon, authenticated, service_role;
