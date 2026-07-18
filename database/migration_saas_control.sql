-- =========================================================================
-- VELOCCE PRO - MIGRACIÓN SQL PARA CONTROL DE SUSCRIPCIÓN Y CONTRATOS
-- Creación de la tabla global de metadatos de talleres/inquilinos (SaaS)
-- =========================================================================

BEGIN;

-- 1. Crear tabla companies
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    contract_accepted BOOLEAN DEFAULT FALSE,
    contract_accepted_by TEXT,
    contract_accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Asegurar el registro del inquilino original de Piripi
INSERT INTO companies (id, name, is_active, contract_accepted)
VALUES ('piripi', 'VELOCCE SANTA FE', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Asegurar el registro del espacio de administración del desarrollador
INSERT INTO companies (id, name, is_active, contract_accepted)
VALUES ('saas-admin', 'CONSOLA MASTER DESARROLLADOR', TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Inicializar cualquier otra empresa existente en la tabla de empleados
DO $$
DECLARE
    rec RECORD;
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'employees' 
        AND column_name = 'company_id'
    ) THEN
        FOR rec IN SELECT DISTINCT company_id FROM employees WHERE company_id IS NOT NULL AND company_id <> '' LOOP
            INSERT INTO companies (id, name, is_active, contract_accepted)
            VALUES (rec.company_id, UPPER(rec.company_id), TRUE, FALSE)
            ON CONFLICT (id) DO NOTHING;
        END LOOP;
    END IF;
END $$;

COMMIT;
