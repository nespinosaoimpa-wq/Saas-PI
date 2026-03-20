-- ==============================================================================
-- SCHEMA SUPABASE: AUDITORIA Y MAPA DE CALOR
-- ==============================================================================

-- Tabla de Auditoría (Movimientos y Acciones)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    employee_id UUID REFERENCES employees(id),
    action TEXT NOT NULL,
    details JSONB,
    path TEXT
);

-- Tabla para Mapa de Calor (Uso de botones)
CREATE TABLE IF NOT EXISTS button_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    button_id TEXT NOT NULL,
    page TEXT NOT NULL,
    employee_id UUID REFERENCES employees(id),
    count INTEGER DEFAULT 1
);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE button_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to authenticated anon audit_logs" ON audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all access to authenticated anon button_clicks" ON button_clicks FOR ALL USING (true);
