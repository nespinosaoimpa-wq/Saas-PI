-- Fix missing columns on payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE;

-- Reload cache immediately
NOTIFY pgrst, 'reload schema';
