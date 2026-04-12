import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function mapSuppliers() {
    console.log("=== INICIANDO VINCULACIÓN AUTOMÁTICA DE PROVEEDORES ===");

    // 1. Obtener la lista de proveedores actuales
    const { data: suppliers } = await supabase.from('suppliers').select('id, name');
    // 2. Obtener productos que tienen texto en 'supplier' pero supplier_id es nulo
    const { data: inventory } = await supabase.from('inventory')
        .select('id, name, supplier')
        .is('supplier_id', null)
        .not('supplier', 'is', null)
        .neq('supplier', '');

    if (!inventory || inventory.length === 0) {
        console.log("No hay productos pendientes de vincular.");
        return;
    }

    console.log(`Encontrados ${inventory.length} productos con proveedor en texto.`);

    let successCount = 0;
    for (const item of inventory) {
        // Buscar coincidencia exacta (ignorando mayúsculas/minúsculas)
        const match = suppliers?.find(s => s.name.trim().toLowerCase() === item.supplier.trim().toLowerCase());
        
        if (match) {
            const { error } = await supabase.from('inventory')
                .update({ supplier_id: match.id })
                .eq('id', item.id);
            
            if (!error) {
                console.log(`[OK] ${item.name} -> ${match.name}`);
                successCount++;
            } else {
                console.error(`[ERR] Error vinculando ${item.name}:`, error.message);
            }
        } else {
            console.log(`[SKIP] No se encontró proveedor para "${item.supplier}" (Producto: ${item.name})`);
        }
    }

    console.log(`\n¡Mapeo completado! Vinculaciones exitosas: ${successCount}`);
}

mapSuppliers();
