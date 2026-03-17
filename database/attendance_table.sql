-- ============================================================
-- TABLA DE ASISTENCIA / FICHAJE DE PERSONAL
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'IN' o 'OUT'
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    time_display TEXT, -- Copia legible (ej: "08:30")
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_logs;

-- Deshabilitar RLS (MVP Style)
ALTER TABLE public.attendance_logs DISABLE ROW LEVEL SECURITY;

-- Permisos
GRANT ALL ON public.attendance_logs TO anon;
GRANT ALL ON public.attendance_logs TO authenticated;
GRANT ALL ON public.attendance_logs TO service_role;
