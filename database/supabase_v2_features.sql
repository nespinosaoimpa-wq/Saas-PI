-- ==========================================
-- PIRIPI PRO: V2 Features Migration
-- SQL Script for Phase 5: Real Cash Register (FIXED)
-- ==========================================

-- 1. Actualizar "payments" (añadir columna payment_type para egresos/ingresos)
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'INCOME' CHECK (payment_type IN ('INCOME', 'EXPENSE'));

-- Habilitar RLS en payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to payments" ON public.payments;
CREATE POLICY "Allow authenticated full access to payments" ON public.payments FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon read access to payments" ON public.payments;
CREATE POLICY "Allow anon read access to payments" ON public.payments FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Allow anon insert access to payments" ON public.payments;
CREATE POLICY "Allow anon insert access to payments" ON public.payments FOR INSERT TO anon WITH CHECK (true);


-- 2. Crear "cash_register_closings" (al parecer no se había creado antes)
CREATE TABLE IF NOT EXISTS public.cash_register_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closing_date DATE NOT NULL UNIQUE,
    total_cash NUMERIC(12,2) DEFAULT 0,
    total_transfer NUMERIC(12,2) DEFAULT 0,
    total_card NUMERIC(12,2) DEFAULT 0,
    grand_total NUMERIC(12,2) DEFAULT 0,
    expected_cash NUMERIC(12,2) DEFAULT 0,
    difference NUMERIC(12,2) DEFAULT 0,
    total_orders_completed INTEGER DEFAULT 0,
    notes TEXT,
    closed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Políticas RLS para cash_register_closings
ALTER TABLE public.cash_register_closings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated full access to cash_register_closings" ON public.cash_register_closings;
CREATE POLICY "Allow authenticated full access to cash_register_closings" ON public.cash_register_closings FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon full access to cash_register_closings" ON public.cash_register_closings;
CREATE POLICY "Allow anon full access to cash_register_closings" ON public.cash_register_closings FOR ALL TO anon USING (true);

-- 3. Notificar a Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE cash_register_closings;
