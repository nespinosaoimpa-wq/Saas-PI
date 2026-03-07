-- ============================================================
-- SAAS PIRIPI - ESQUEMA COMPLETO DE BASE DE DATOS (SUPABASE)
-- Sistema de Gestión Integral para Lubricentro
-- Versión: 1.0.0
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'mechanic', 'receptionist');
CREATE TYPE stock_type AS ENUM ('UNIT', 'VOLUME');
CREATE TYPE payment_method AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA');
CREATE TYPE work_order_status AS ENUM ('Pendiente', 'En Box', 'Finalizado', 'Cancelado');
CREATE TYPE appointment_status AS ENUM ('Programado', 'Confirmado', 'En Curso', 'Completado', 'Cancelado');
CREATE TYPE box_status AS ENUM ('Libre', 'Ocupado', 'Mantenimiento');

-- ============================================================
-- 1. USUARIOS Y ROLES (Multi-usuario jerárquico)
-- ============================================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'mechanic',
    commission_rate NUMERIC(5,2) DEFAULT 0, -- Porcentaje de comisión (ej: 10.00 = 10%)
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CLIENTES
-- ============================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    dni TEXT,
    notes TEXT,
    is_frequent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_name ON clients(last_name, first_name);
CREATE INDEX idx_clients_phone ON clients(phone);

-- ============================================================
-- 3. VEHÍCULOS (Relación 1:N con clientes)
-- ============================================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    license_plate TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    color TEXT,
    km INTEGER DEFAULT 0,
    difficulty_factor NUMERIC(3,2) DEFAULT 1.00,
    -- Factor de dificultad: 1.0 = normal, 1.5 = medio, 2.0 = complejo
    engine_type TEXT,
    fuel_type TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_client ON vehicles(client_id);

-- ============================================================
-- 4. SALUD DEL VEHÍCULO (Health Scoring)
-- ============================================================

CREATE TABLE vehicle_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
    health_score INTEGER DEFAULT 100, -- 0-100
    last_oil_change TIMESTAMPTZ,
    last_oil_change_km INTEGER,
    last_tire_change TIMESTAMPTZ,
    last_filter_change TIMESTAMPTZ,
    last_brake_check TIMESTAMPTZ,
    last_coolant_change TIMESTAMPTZ,
    tire_wear_level INTEGER DEFAULT 100, -- 0-100
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. BOXES (Boxes físicos del taller)
-- ============================================================

CREATE TABLE boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status box_status DEFAULT 'Libre',
    assigned_mechanic_id UUID REFERENCES user_profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. PROVEEDORES
-- ============================================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    cuit TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. MARCAS DE PRODUCTOS
-- ============================================================

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. INVENTARIO / STOCK
-- ============================================================

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    barcode TEXT UNIQUE,  -- Código EAN
    brand_id UUID REFERENCES brands(id),
    supplier_id UUID REFERENCES suppliers(id),
    category TEXT, -- 'Aceite', 'Filtro', 'Pastillas', 'Cubiertas', etc.
    
    -- Tipo de stock
    stock_type stock_type NOT NULL DEFAULT 'UNIT',
    
    -- Para tipo UNIT (filtros, pastillas, etc.)
    stock_quantity INTEGER DEFAULT 0,
    stock_min INTEGER DEFAULT 5,  -- Alerta de stock mínimo
    
    -- Para tipo VOLUME (aceite en contenedores)
    -- Todo se almacena internamente en MILILITROS (ML)
    stock_ml INTEGER DEFAULT 0,      -- Stock actual en ML
    stock_min_ml INTEGER DEFAULT 20000, -- Alerta mínima en ML (20 litros)
    container_size_ml INTEGER,       -- Tamaño del contenedor en ML (ej: 20000 = 20L)
    
    -- Precios
    cost_price NUMERIC(12,2) DEFAULT 0,     -- Precio de costo
    sell_price NUMERIC(12,2) DEFAULT 0,     -- Precio de venta por unidad o por litro
    sell_price_per_ml NUMERIC(10,4),        -- Precio por ML (calculado automáticamente)
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_barcode ON inventory_items(barcode);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_brand ON inventory_items(brand_id);
CREATE INDEX idx_inventory_supplier ON inventory_items(supplier_id);

-- ============================================================
-- 9. MOVIMIENTOS DE STOCK (Ingreso de Mercadería)
-- ============================================================

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    movement_type TEXT NOT NULL, -- 'INGRESO', 'EGRESO', 'AJUSTE'
    quantity INTEGER, -- Para UNIT
    quantity_ml INTEGER, -- Para VOLUME
    previous_stock INTEGER,
    new_stock INTEGER,
    previous_stock_ml INTEGER,
    new_stock_ml INTEGER,
    cost_price NUMERIC(12,2),
    sell_price NUMERIC(12,2),
    reason TEXT,
    user_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. ÓRDENES DE TRABAJO (OT)
-- ============================================================

CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL, -- Número secuencial visible
    qr_uuid UUID DEFAULT gen_random_uuid(), -- UUID único para QR
    
    -- Relaciones
    client_id UUID NOT NULL REFERENCES clients(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    box_id UUID REFERENCES boxes(id),
    assigned_mechanic_id UUID REFERENCES user_profiles(id),
    created_by UUID REFERENCES user_profiles(id),
    
    -- Estados
    status work_order_status DEFAULT 'Pendiente',
    
    -- Kilometraje al ingresar
    km_at_entry INTEGER,
    
    -- Descripción del trabajo
    description TEXT,
    diagnostic TEXT,
    observations TEXT,
    
    -- Fotos del vehículo al ingresar (URLs de Supabase Storage)
    photos JSONB DEFAULT '[]'::jsonb,
    
    -- Precios calculados
    labor_base_price NUMERIC(12,2) DEFAULT 0,
    total_parts_cost NUMERIC(12,2) DEFAULT 0,
    total_price NUMERIC(12,2) DEFAULT 0,
    
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_status ON work_orders(status);
CREATE INDEX idx_wo_client ON work_orders(client_id);
CREATE INDEX idx_wo_vehicle ON work_orders(vehicle_id);
CREATE INDEX idx_wo_qr ON work_orders(qr_uuid);
CREATE INDEX idx_wo_date ON work_orders(created_at);

-- ============================================================
-- 11. ITEMS DE LA ORDEN DE TRABAJO
-- ============================================================

CREATE TABLE work_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES inventory_items(id),
    
    description TEXT NOT NULL,
    
    -- Cantidad
    quantity NUMERIC(10,2) DEFAULT 1,
    unit TEXT DEFAULT 'unidad', -- 'unidad', 'ml', 'litro'
    quantity_ml INTEGER, -- Si es aceite, la cantidad real en ML
    
    -- Precios
    unit_price NUMERIC(12,2) DEFAULT 0,
    total_price NUMERIC(12,2) DEFAULT 0,
    
    is_labor BOOLEAN DEFAULT FALSE, -- TRUE si es mano de obra
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. CHECKLIST DE SEGURIDAD
-- ============================================================

CREATE TABLE work_order_checklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    
    -- Items del checklist
    luces_delanteras BOOLEAN DEFAULT FALSE,
    luces_traseras BOOLEAN DEFAULT FALSE,
    luces_giro BOOLEAN DEFAULT FALSE,
    nivel_aceite BOOLEAN DEFAULT FALSE,
    nivel_refrigerante BOOLEAN DEFAULT FALSE,
    nivel_liquido_frenos BOOLEAN DEFAULT FALSE,
    presion_neumaticos BOOLEAN DEFAULT FALSE,
    estado_neumaticos BOOLEAN DEFAULT FALSE,
    freno_mano BOOLEAN DEFAULT FALSE,
    limpiaparabrisas BOOLEAN DEFAULT FALSE,
    bateria BOOLEAN DEFAULT FALSE,
    correas BOOLEAN DEFAULT FALSE,
    
    -- Presiones específicas
    presion_del_izq NUMERIC(4,1),
    presion_del_der NUMERIC(4,1),
    presion_tra_izq NUMERIC(4,1),
    presion_tra_der NUMERIC(4,1),
    
    observations TEXT,
    checked_by UUID REFERENCES user_profiles(id),
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. PAGOS / CAJA
-- ============================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID REFERENCES work_orders(id),
    
    amount NUMERIC(12,2) NOT NULL,
    payment_method payment_method NOT NULL,
    
    -- Referencia para transferencias/tarjetas
    reference TEXT,
    
    description TEXT,
    received_by UUID REFERENCES user_profiles(id),
    
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);

-- ============================================================
-- 14. CIERRES DE CAJA (Balances)
-- ============================================================

CREATE TABLE cash_register_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    closing_date DATE NOT NULL UNIQUE,
    
    total_cash NUMERIC(12,2) DEFAULT 0,
    total_transfer NUMERIC(12,2) DEFAULT 0,
    total_card NUMERIC(12,2) DEFAULT 0,
    grand_total NUMERIC(12,2) DEFAULT 0,
    
    total_orders_completed INTEGER DEFAULT 0,
    
    notes TEXT,
    closed_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. TURNOS / CITAS
-- ============================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    vehicle_id UUID REFERENCES vehicles(id),
    box_id UUID REFERENCES boxes(id),
    assigned_mechanic_id UUID REFERENCES user_profiles(id),
    
    title TEXT NOT NULL,
    description TEXT,
    
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    status appointment_status DEFAULT 'Programado',
    
    -- Si se convirtió en OT
    work_order_id UUID REFERENCES work_orders(id),
    
    color TEXT DEFAULT '#0df2f2', -- Color para el calendario
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_date ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================================
-- 16. PROMOCIONES
-- ============================================================

CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    
    discount_type TEXT NOT NULL, -- 'PERCENTAGE', 'FIXED'
    discount_value NUMERIC(10,2) NOT NULL,
    
    -- Condiciones
    min_km INTEGER, -- Km mínimos sin servicio para activar
    service_type TEXT, -- Tipo de servicio ('oil_change', 'tire_change', etc.)
    applies_to_category TEXT, -- Categoría de inventario
    
    -- Vigencia
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Para sugerencias automáticas
    auto_suggest BOOLEAN DEFAULT TRUE,
    days_since_last_service INTEGER, -- Sugerir si pasaron X días
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. TRABAJOS DIARIOS (Log de actividades del mecánico)
-- ============================================================

CREATE TABLE daily_work_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mechanic_id UUID NOT NULL REFERENCES user_profiles(id),
    work_order_id UUID REFERENCES work_orders(id),
    
    work_date DATE DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    hours_worked NUMERIC(4,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_log_date ON daily_work_log(work_date);
CREATE INDEX idx_daily_log_mechanic ON daily_work_log(mechanic_id);

-- ============================================================
-- 18. GOMERÍA (Servicios Rápidos Diarios)
-- ============================================================

CREATE TABLE daily_quick_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL, -- 'Parche Moto', 'Parche Auto', 'Ajuste Cadena', 'Inflado Air'
    price NUMERIC(12,2) NOT NULL,
    mechanic_id UUID REFERENCES user_profiles(id),
    vehicle_id UUID REFERENCES vehicles(id),
    client_id UUID REFERENCES clients(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 19. HISTORIAL DE SERVICIOS (Línea de tiempo)
-- ============================================================

CREATE TABLE service_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    quick_service_id UUID REFERENCES daily_quick_services(id) ON DELETE SET NULL,
    service_date TIMESTAMPTZ DEFAULT NOW(),
    description TEXT NOT NULL, -- "Lo que se le hizo al vehículo"
    km_at_service INTEGER,
    performed_by UUID REFERENCES user_profiles(id),
    total_amount NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. GANANCIAS DE EMPLEADOS (Comisiones)
-- ============================================================

CREATE TABLE employee_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id),
    quick_service_id UUID REFERENCES daily_quick_services(id),
    amount_earned NUMERIC(12,2) NOT NULL,
    description TEXT,
    payment_reference_id UUID REFERENCES payments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_earnings_employee ON employee_earnings(employee_id);
CREATE INDEX idx_quick_services_date ON daily_quick_services(created_at);
CREATE INDEX idx_service_history_vehicle ON service_history(vehicle_id);

-- ============================================================
-- FUNCIONES
-- ============================================================

-- Función: Descontar stock por volumen (ML)
CREATE OR REPLACE FUNCTION deduct_volume(
    p_item_id UUID,
    p_ml_amount INTEGER,
    p_user_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_ml INTEGER;
    v_stock_type stock_type;
BEGIN
    SELECT stock_ml, stock_type INTO v_current_ml, v_stock_type
    FROM inventory_items WHERE id = p_item_id;
    
    IF v_stock_type != 'VOLUME' THEN
        RAISE EXCEPTION 'Este artículo no es de tipo VOLUMEN';
    END IF;
    
    IF v_current_ml < p_ml_amount THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponible: % ml, Solicitado: % ml', v_current_ml, p_ml_amount;
    END IF;
    
    UPDATE inventory_items 
    SET stock_ml = stock_ml - p_ml_amount,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    INSERT INTO stock_movements (item_id, movement_type, quantity_ml, previous_stock_ml, new_stock_ml, user_id, reason)
    VALUES (p_item_id, 'EGRESO', p_ml_amount, v_current_ml, v_current_ml - p_ml_amount, p_user_id, 'Uso en OT');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Descontar stock por unidad
CREATE OR REPLACE FUNCTION deduct_units(
    p_item_id UUID,
    p_quantity INTEGER,
    p_user_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_qty INTEGER;
    v_stock_type stock_type;
BEGIN
    SELECT stock_quantity, stock_type INTO v_current_qty, v_stock_type
    FROM inventory_items WHERE id = p_item_id;
    
    IF v_stock_type != 'UNIT' THEN
        RAISE EXCEPTION 'Este artículo no es de tipo UNIDAD';
    END IF;
    
    IF v_current_qty < p_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', v_current_qty, p_quantity;
    END IF;
    
    UPDATE inventory_items 
    SET stock_quantity = stock_quantity - p_quantity,
        updated_at = NOW()
    WHERE id = p_item_id;
    
    INSERT INTO stock_movements (item_id, movement_type, quantity, previous_stock, new_stock, user_id, reason)
    VALUES (p_item_id, 'EGRESO', p_quantity, v_current_qty, v_current_qty - p_quantity, p_user_id, 'Uso en OT');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Calcular precio dinámico de una OT
CREATE OR REPLACE FUNCTION calculate_work_order_price(p_wo_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_parts_total NUMERIC := 0;
    v_labor_total NUMERIC := 0;
    v_difficulty NUMERIC := 1.0;
    v_grand_total NUMERIC;
BEGIN
    -- Obtener factor de dificultad del vehículo
    SELECT COALESCE(v.difficulty_factor, 1.0) INTO v_difficulty
    FROM work_orders wo
    JOIN vehicles v ON v.id = wo.vehicle_id
    WHERE wo.id = p_wo_id;
    
    -- Sumar insumos
    SELECT COALESCE(SUM(total_price), 0) INTO v_parts_total
    FROM work_order_items
    WHERE work_order_id = p_wo_id AND is_labor = FALSE;
    
    -- Sumar mano de obra (ajustada por dificultad)
    SELECT COALESCE(SUM(total_price * v_difficulty), 0) INTO v_labor_total
    FROM work_order_items
    WHERE work_order_id = p_wo_id AND is_labor = TRUE;
    
    v_grand_total := v_parts_total + v_labor_total;
    
    -- Actualizar la OT
    UPDATE work_orders SET 
        total_parts_cost = v_parts_total,
        labor_base_price = v_labor_total,
        total_price = v_grand_total,
        updated_at = NOW()
    WHERE id = p_wo_id;
    
    RETURN v_grand_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Calcular health score del vehículo
CREATE OR REPLACE FUNCTION calculate_vehicle_health(p_vehicle_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 100;
    v_health RECORD;
    v_days_oil INTEGER;
    v_days_tires INTEGER;
    v_days_filter INTEGER;
    v_days_brakes INTEGER;
BEGIN
    SELECT * INTO v_health FROM vehicle_health WHERE vehicle_id = p_vehicle_id;
    
    IF NOT FOUND THEN
        INSERT INTO vehicle_health (vehicle_id) VALUES (p_vehicle_id);
        RETURN 100;
    END IF;
    
    -- Penalizar por aceite viejo (> 6 meses = -20, > 12 meses = -40)
    IF v_health.last_oil_change IS NOT NULL THEN
        v_days_oil := EXTRACT(DAY FROM NOW() - v_health.last_oil_change);
        IF v_days_oil > 365 THEN v_score := v_score - 40;
        ELSIF v_days_oil > 180 THEN v_score := v_score - 20;
        ELSIF v_days_oil > 90 THEN v_score := v_score - 10;
        END IF;
    ELSE
        v_score := v_score - 15; -- Sin datos
    END IF;
    
    -- Penalizar por cubiertas viejas (> 2 años = -25)
    IF v_health.last_tire_change IS NOT NULL THEN
        v_days_tires := EXTRACT(DAY FROM NOW() - v_health.last_tire_change);
        IF v_days_tires > 730 THEN v_score := v_score - 25;
        ELSIF v_days_tires > 365 THEN v_score := v_score - 10;
        END IF;
    ELSE
        v_score := v_score - 10;
    END IF;
    
    -- Penalizar por filtro viejo
    IF v_health.last_filter_change IS NOT NULL THEN
        v_days_filter := EXTRACT(DAY FROM NOW() - v_health.last_filter_change);
        IF v_days_filter > 365 THEN v_score := v_score - 15;
        ELSIF v_days_filter > 180 THEN v_score := v_score - 5;
        END IF;
    END IF;
    
    -- Penalizar por frenos sin revisar
    IF v_health.last_brake_check IS NOT NULL THEN
        v_days_brakes := EXTRACT(DAY FROM NOW() - v_health.last_brake_check);
        IF v_days_brakes > 365 THEN v_score := v_score - 15;
        END IF;
    END IF;
    
    -- Piso mínimo
    IF v_score < 0 THEN v_score := 0; END IF;
    
    -- Actualizar score
    UPDATE vehicle_health SET health_score = v_score, updated_at = NOW()
    WHERE vehicle_id = p_vehicle_id;
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Balance diario de caja
CREATE OR REPLACE FUNCTION get_daily_balance(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    total_cash NUMERIC,
    total_transfer NUMERIC,
    total_card NUMERIC,
    grand_total NUMERIC,
    num_payments INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'EFECTIVO' THEN amount ELSE 0 END), 0) as total_cash,
        COALESCE(SUM(CASE WHEN payment_method = 'TRANSFERENCIA' THEN amount ELSE 0 END), 0) as total_transfer,
        COALESCE(SUM(CASE WHEN payment_method = 'TARJETA' THEN amount ELSE 0 END), 0) as total_card,
        COALESCE(SUM(amount), 0) as grand_total,
        COUNT(*)::INTEGER as num_payments
    FROM payments
    WHERE payment_date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Balance por rango de fechas (semanal/mensual)
CREATE OR REPLACE FUNCTION get_balance_range(p_start DATE, p_end DATE)
RETURNS TABLE (
    period_date DATE,
    total_cash NUMERIC,
    total_transfer NUMERIC,
    total_card NUMERIC,
    grand_total NUMERIC,
    num_payments INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.payment_date,
        COALESCE(SUM(CASE WHEN p.payment_method = 'EFECTIVO' THEN p.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN p.payment_method = 'TRANSFERENCIA' THEN p.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN p.payment_method = 'TARJETA' THEN p.amount ELSE 0 END), 0),
        COALESCE(SUM(p.amount), 0),
        COUNT(*)::INTEGER
    FROM payments p
    WHERE p.payment_date BETWEEN p_start AND p_end
    GROUP BY p.payment_date
    ORDER BY p.payment_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Items con stock bajo
CREATE OR REPLACE FUNCTION get_low_stock_items()
RETURNS TABLE (
    item_id UUID,
    item_name TEXT,
    category TEXT,
    stock_type stock_type,
    current_stock INTEGER,
    min_stock INTEGER,
    current_ml INTEGER,
    min_ml INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id, i.name, i.category, i.stock_type,
        i.stock_quantity, i.stock_min,
        i.stock_ml, i.stock_min_ml
    FROM inventory_items i
    WHERE i.is_active = TRUE
    AND (
        (i.stock_type = 'UNIT' AND i.stock_quantity <= i.stock_min)
        OR
        (i.stock_type = 'VOLUME' AND i.stock_ml <= i.stock_min_ml)
    )
    ORDER BY 
        CASE 
            WHEN i.stock_type = 'UNIT' THEN (i.stock_quantity::NUMERIC / GREATEST(i.stock_min, 1))
            ELSE (i.stock_ml::NUMERIC / GREATEST(i.stock_min_ml, 1))
        END ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Auto-calcular sell_price_per_ml al actualizar precio de VOLUME items
CREATE OR REPLACE FUNCTION update_price_per_ml()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_type = 'VOLUME' AND NEW.container_size_ml > 0 AND NEW.sell_price > 0 THEN
        NEW.sell_price_per_ml := NEW.sell_price / (NEW.container_size_ml::NUMERIC / 1000);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_price_per_ml
    BEFORE INSERT OR UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_price_per_ml();

-- Trigger: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_wo_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Liberar box cuando OT se finaliza
CREATE OR REPLACE FUNCTION release_box_on_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Finalizado' AND OLD.status != 'Finalizado' THEN
        NEW.completed_at := NOW();
        IF NEW.box_id IS NOT NULL THEN
            UPDATE boxes SET status = 'Libre', assigned_mechanic_id = NULL WHERE id = NEW.box_id;
        END IF;
    END IF;
    
    IF NEW.status = 'En Box' AND OLD.status != 'En Box' THEN
        NEW.started_at := NOW();
        IF NEW.box_id IS NOT NULL THEN
            UPDATE boxes SET status = 'Ocupado', assigned_mechanic_id = NEW.assigned_mechanic_id WHERE id = NEW.box_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_release_box
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION release_box_on_complete();

-- ============================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_work_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register_closings ENABLE ROW LEVEL SECURITY;

-- Policy helper: Check user role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM user_profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Admin y Supervisor: acceso total a todo
CREATE POLICY "admin_full_access" ON clients FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON vehicles FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON inventory_items FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON work_orders FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON work_order_items FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON work_order_checklist FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON payments FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON appointments FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON boxes FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON suppliers FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON brands FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON promotions FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON stock_movements FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON daily_work_log FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON vehicle_health FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON cash_register_closings FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));
CREATE POLICY "admin_full_access" ON user_profiles FOR ALL USING (auth_user_role() IN ('admin', 'supervisor'));

-- Mecánicos: leer clientes/vehículos, CRUD OTs asignadas, leer inventario
CREATE POLICY "mechanic_read_clients" ON clients FOR SELECT USING (auth_user_role() = 'mechanic');
CREATE POLICY "mechanic_read_vehicles" ON vehicles FOR SELECT USING (auth_user_role() = 'mechanic');
CREATE POLICY "mechanic_read_inventory" ON inventory_items FOR SELECT USING (auth_user_role() = 'mechanic');
CREATE POLICY "mechanic_own_orders" ON work_orders FOR ALL 
    USING (auth_user_role() = 'mechanic' AND assigned_mechanic_id = auth.uid());
CREATE POLICY "mechanic_own_wo_items" ON work_order_items FOR ALL 
    USING (auth_user_role() = 'mechanic' AND work_order_id IN (
        SELECT id FROM work_orders WHERE assigned_mechanic_id = auth.uid()
    ));
CREATE POLICY "mechanic_own_checklist" ON work_order_checklist FOR ALL 
    USING (auth_user_role() = 'mechanic' AND work_order_id IN (
        SELECT id FROM work_orders WHERE assigned_mechanic_id = auth.uid()
    ));
CREATE POLICY "mechanic_own_daily_log" ON daily_work_log FOR ALL 
    USING (auth_user_role() = 'mechanic' AND mechanic_id = auth.uid());
CREATE POLICY "mechanic_read_boxes" ON boxes FOR SELECT USING (auth_user_role() = 'mechanic');
CREATE POLICY "mechanic_read_brands" ON brands FOR SELECT USING (auth_user_role() = 'mechanic');

-- Recepcionista: CRUD clientes, vehículos, citas, leer inventario y OTs
CREATE POLICY "receptionist_clients" ON clients FOR ALL USING (auth_user_role() = 'receptionist');
CREATE POLICY "receptionist_vehicles" ON vehicles FOR ALL USING (auth_user_role() = 'receptionist');
CREATE POLICY "receptionist_appointments" ON appointments FOR ALL USING (auth_user_role() = 'receptionist');
CREATE POLICY "receptionist_read_orders" ON work_orders FOR SELECT USING (auth_user_role() = 'receptionist');
CREATE POLICY "receptionist_read_inventory" ON inventory_items FOR SELECT USING (auth_user_role() = 'receptionist');
CREATE POLICY "receptionist_payments" ON payments FOR ALL USING (auth_user_role() = 'receptionist');
CREATE POLICY "receptionist_read_boxes" ON boxes FOR SELECT USING (auth_user_role() = 'receptionist');
CREATE POLICY "receptionist_read_brands" ON brands FOR SELECT USING (auth_user_role() = 'receptionist');

-- Perfil propio: todos pueden leer su propio perfil  
CREATE POLICY "own_profile" ON user_profiles FOR SELECT USING (id = auth.uid());

-- ============================================================
-- DATOS INICIALES DE EJEMPLO
-- ============================================================

-- Boxes del taller
INSERT INTO boxes (name, description) VALUES
    ('Box 1', 'Box principal - trabajos generales'),
    ('Box 2', 'Box secundario - cambios de aceite'),
    ('Box 3', 'Box gomería - cubiertas y alineación'),
    ('Box 4', 'Box rápido - servicios express');

-- Marcas de ejemplo
INSERT INTO brands (name) VALUES
    ('YPF'), ('Shell'), ('Mobil'), ('Castrol'), ('Total'),
    ('Mann Filter'), ('Bosch'), ('NGK'), ('Firestone'), ('Pirelli'),
    ('Continental'), ('Goodyear'), ('Bardahl'), ('Liqui Moly');

-- Categorías sugeridas en los items se manejan como TEXT libre:
-- 'Aceite Motor', 'Aceite Caja', 'Filtro Aceite', 'Filtro Aire', 
-- 'Filtro Combustible', 'Filtro Habitáculo', 'Pastillas Freno',
-- 'Discos Freno', 'Cubiertas', 'Bujías', 'Refrigerante',
-- 'Líquido Frenos', 'Correas', 'Amortiguadores', 'Varios'
