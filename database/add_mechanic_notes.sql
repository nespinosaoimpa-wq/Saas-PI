-- Migration: Add mechanic_notes column to work_orders table
ALTER TABLE IF EXISTS public.work_orders ADD COLUMN IF NOT EXISTS mechanic_notes TEXT;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
