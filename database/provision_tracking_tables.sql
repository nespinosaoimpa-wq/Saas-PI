-- ==========================================================
-- PROVISIÓN DE TABLAS DE TRACKING Y AUDITORÍA
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================================

-- 1. Crear tabla de Clicks (Mapa de Calor) si no existe
CREATE TABLE IF NOT EXISTS public.button_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    page TEXT NOT NULL,
    button_id TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    employee_id UUID REFERENCES public.employees(id),
    UNIQUE(page, button_id)
);

-- 2. Crear tabla de Auditoría si no existe
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    employee_id UUID REFERENCES public.employees(id),
    action TEXT NOT NULL,
    details JSONB,
    path TEXT
);

-- 3. Habilitar RLS
ALTER TABLE public.button_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de acceso total para autenticados
-- Nota: Usamos IF NOT EXISTS indirectamente mediante DO
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'button_clicks' AND policyname = 'Allow all for tracking') THEN
        CREATE POLICY "Allow all for tracking" ON public.button_clicks FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Allow all for audit') THEN
        CREATE POLICY "Allow all for audit" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. Dar permisos a los roles de Supabase (anon y authenticated)
GRANT ALL ON public.button_clicks TO anon, authenticated, service_role;
GRANT ALL ON public.audit_logs TO anon, authenticated, service_role;
