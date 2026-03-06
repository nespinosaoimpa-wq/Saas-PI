-- Añadir columnas para facturación electrónica AFIP a la tabla payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cae TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cae_due_date TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number TEXT;
