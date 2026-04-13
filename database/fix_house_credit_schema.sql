-- ==========================================================
-- SCRIPT DE REPARACIÓN MAESTRA: CRÉDITOS DE LA CASA
-- Ejecutar en el Editor SQL de Supabase para activar créditos
-- ==========================================================

-- 1. Crear tabla de créditos si no existe
CREATE TABLE IF NOT EXISTS public.client_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    initial_payment NUMERIC(10,2) DEFAULT 0.0,
    current_balance NUMERIC(10,2) NOT NULL,
    interest_rate NUMERIC(5,2) DEFAULT 0.0,
    payment_frequency TEXT CHECK (payment_frequency IN ('SEMANAL', 'QUINCENAL', 'MENSUAL', 'LIBRE')) DEFAULT 'LIBRE',
    status TEXT CHECK (status IN ('ACTIVO', 'PAGADO', 'MOROSO')) DEFAULT 'ACTIVO',
    next_payment_date DATE,
    notes TEXT
);

-- 2. Asegurar que la tabla payments tenga la columna de crédito
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'client_credit_id') THEN
        ALTER TABLE public.payments ADD COLUMN client_credit_id UUID REFERENCES public.client_credits(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Asegurar que el método 'CREDITO_CASA' sea válido
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_method_check 
    CHECK (method IN ('EFECTIVO', 'TARJETA', 'DEBITO', 'CREDITO', 'TRANSFERENCIA', 'COMBINADO', 'CREDITO_CASA'));

-- 4. Polìticas de Seguridad RLS
ALTER TABLE public.client_credits ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_credits' AND policyname = 'Allow all for credits') THEN
        CREATE POLICY "Allow all for credits" ON public.client_credits FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 5. Dar permisos
GRANT ALL ON public.client_credits TO anon, authenticated, service_role;
GRANT ALL ON public.payments TO anon, authenticated, service_role;
