-- Tabla para almacenar la configuración de AFIP del cliente de forma segura
CREATE TABLE IF NOT EXISTS afip_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cuit TEXT NOT NULL,
    cert_crt TEXT,            -- Contenido del archivo .crt
    private_key TEXT,         -- Contenido del archivo .key
    pto_vta INTEGER DEFAULT 1,
    environment TEXT DEFAULT 'homologation', -- 'homologation' o 'production'
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE afip_config ENABLE ROW LEVEL SECURITY;

-- Política: Solo administradores pueden ver/editar la configuración
CREATE POLICY "Admin full access on afip_config" 
    ON afip_config 
    TO authenticated
    USING (EXISTS (SELECT 1 FROM employees WHERE employees.auth_id = auth.uid() AND employees.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM employees WHERE employees.auth_id = auth.uid() AND employees.role = 'admin'));

-- Insertar fila inicial vacía si no existe
INSERT INTO afip_config (cuit, environment) 
SELECT '20000000001', 'homologation'
WHERE NOT EXISTS (SELECT 1 FROM afip_config);
