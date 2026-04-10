-- 1. Crear tabla de Créditos de la Casa (Cuentas Corrientes)
CREATE TABLE client_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    initial_payment NUMERIC(10,2) DEFAULT 0.0,
    current_balance NUMERIC(10,2) NOT NULL,
    interest_rate NUMERIC(5,2) DEFAULT 0.0,
    payment_frequency TEXT CHECK (payment_frequency IN ('SEMANAL', 'QUINCENAL', 'MENSUAL', 'LIBRE')) DEFAULT 'LIBRE',
    next_payment_date DATE,
    status TEXT CHECK (status IN ('ACTIVO', 'PAGADO', 'MOROSO')) DEFAULT 'ACTIVO',
    notes TEXT
);

-- 2. Habilitar RLS para la nueva tabla
ALTER TABLE client_credits ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para acceso completo (ajustar según roles si es necesario)
CREATE POLICY "Permitir todo a usuarios autenticados" ON client_credits
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Actualizar tabla de pagos para vincular a créditos
ALTER TABLE payments ADD COLUMN client_credit_id UUID REFERENCES client_credits(id) ON DELETE SET NULL;

-- 5. Actualizar el constraint de 'method' en la tabla payments para incluir 'CREDITO_CASA'
-- Nota: Primero eliminamos el constraint existente y lo recreamos. 
-- El nombre del constraint por defecto suele ser 'payments_method_check' o similar.
-- En schema.sql vimos: CHECK (method IN ('EFECTIVO', 'TARJETA', 'DEBITO', 'CREDITO', 'TRANSFERENCIA', 'COMBINADO'))
-- Lo expandimos para soportar 'CREDITO_CASA'.

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check 
    CHECK (method IN ('EFECTIVO', 'TARJETA', 'DEBITO', 'CREDITO', 'TRANSFERENCIA', 'COMBINADO', 'CREDITO_CASA'));
