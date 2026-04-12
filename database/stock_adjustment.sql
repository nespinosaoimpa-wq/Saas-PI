-- ======================================================
-- ARMADURA DE INVENTARIO: ADJUST STOCK ATOMICALLY
-- ======================================================

CREATE OR REPLACE FUNCTION adjust_inventory_stock(
  item_id UUID,
  adjustment NUMERIC,
  use_ml BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
BEGIN
  IF use_ml THEN
    -- Descuento para productos por volumen (ml)
    UPDATE inventory 
    SET stock_ml = GREATEST(0, COALESCE(stock_ml, 0) + adjustment)
    WHERE id = item_id;
  ELSE
    -- Descuento para productos por unidad
    UPDATE inventory 
    SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) + adjustment)
    WHERE id = item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
