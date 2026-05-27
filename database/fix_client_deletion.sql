-- ==============================================================================
-- SCRIPT DE MIGRACIÓN: SOLUCIÓN DE ERROR AL ELIMINAR CLIENTES Y VEHÍCULOS
-- PIRIPI PRO: Claves foráneas configuradas con ON DELETE SET NULL
-- Instrucciones: Copia y ejecuta todo este bloque en el Editor SQL de tu Supabase
-- ==============================================================================

-- 1. Modificar restricciones en la tabla de Órdenes de Trabajo (work_orders)
-- Eliminar restricciones antiguas si existen
ALTER TABLE public.work_orders DROP CONSTRAINT IF EXISTS work_orders_client_id_fkey;
ALTER TABLE public.work_orders DROP CONSTRAINT IF EXISTS work_orders_vehicle_id_fkey;
ALTER TABLE public.work_orders DROP CONSTRAINT IF EXISTS work_orders_mechanic_id_fkey;

-- Agregar restricciones nuevas con ON DELETE SET NULL
ALTER TABLE public.work_orders
  ADD CONSTRAINT work_orders_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.work_orders
  ADD CONSTRAINT work_orders_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

ALTER TABLE public.work_orders
  ADD CONSTRAINT work_orders_mechanic_id_fkey 
  FOREIGN KEY (mechanic_id) REFERENCES public.employees(id) ON DELETE SET NULL;


-- 2. Modificar restricciones en la tabla de Servicios Rápidos Gomería (daily_quick_services)
-- Eliminar restricciones antiguas si existen
ALTER TABLE public.daily_quick_services DROP CONSTRAINT IF EXISTS daily_quick_services_client_id_fkey;
ALTER TABLE public.daily_quick_services DROP CONSTRAINT IF EXISTS daily_quick_services_vehicle_id_fkey;
ALTER TABLE public.daily_quick_services DROP CONSTRAINT IF EXISTS daily_quick_services_mechanic_id_fkey;

-- Agregar restricciones nuevas con ON DELETE SET NULL
ALTER TABLE public.daily_quick_services
  ADD CONSTRAINT daily_quick_services_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;

ALTER TABLE public.daily_quick_services
  ADD CONSTRAINT daily_quick_services_vehicle_id_fkey 
  FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

ALTER TABLE public.daily_quick_services
  ADD CONSTRAINT daily_quick_services_mechanic_id_fkey 
  FOREIGN KEY (mechanic_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- 3. Notificar a PostgREST que recargue el esquema para aplicar los cambios de inmediato
NOTIFY pgrst, 'reload schema';
