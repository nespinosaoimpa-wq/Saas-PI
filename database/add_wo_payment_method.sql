-- Agregar columna para persistir la forma de pago preferida en la OT
ALTER TABLE public.work_orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
