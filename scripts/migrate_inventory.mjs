import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('Starting inventory migration...');

    try {
        const excelPath = path.resolve(__dirname, '../../INVENTARIO.xls');
        if (!fs.existsSync(excelPath)) {
            throw new Error(`Excel file not found at ${excelPath}`);
        }

        console.log('Reading Excel file...');
        const workbook = xlsx.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} rows in Excel.`);

        const uniqueSuppliers = new Set();

        const formattedData = data.map((row) => {
            const depto = row['Departamento'] ? row['Departamento'].toString().trim() : null;
            if (depto) {
                uniqueSuppliers.add(depto);
            }

            // Basic column mapping based on the provided JSON structure
            return {
                name: (row['Descripcion'] || 'Sin nombre').trim(),
                barcode: row['Codigo'] ? row['Codigo'].toString() : null,
                brand: depto,
                category: depto, // Using Departamento as category too
                supplier: depto, // Mapped column H to supplier
                cost_price: parseFloat(row['Precio Costo']) || 0,
                sell_price: parseFloat(row['Precio Venta']) || 0,
                stock_type: 'UNIT', // Defaulting to unit, since it's hard to guess volume from this excel
                stock_quantity: parseInt(row['Inventario']) || 0,
                stock_ml: 0,
                stock_min: parseInt(row['Inv. Minimo']) || 5, // Defaulting min to 5 if not found
                stock_min_ml: 0,
                container_size_ml: 0
            };
        });

        console.log(`Found ${uniqueSuppliers.size} unique suppliers in Column H.`);

        console.log('Clearing existing suppliers...');
        const { error: deleteSupError } = await supabase
            .from('suppliers')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteSupError) {
            console.warn(`Failed to clear suppliers: ${deleteSupError.message}`);
        } else {
            const suppliersData = Array.from(uniqueSuppliers).map(name => ({
                name: name,
                category: 'Migrado'
            }));

            if (suppliersData.length > 0) {
                console.log('Inserting suppliers...');
                const { error: insertSupError } = await supabase.from('suppliers').insert(suppliersData);
                if (insertSupError) {
                    console.error(`Failed to insert suppliers: ${insertSupError.message}`);
                } else {
                    console.log(`Inserted ${suppliersData.length} suppliers.`);
                }
            }
        }

        console.log('Clearing existing inventory...');
        const { error: deleteError } = await supabase
            .from('inventory')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) {
            throw new Error(`Failed to clear inventory: ${deleteError.message}`);
        }

        console.log('Inserting new inventory data...');
        // Supabase insert limit is usually 1000 per request, so let's chunk it
        const chunkSize = 500;
        for (let i = 0; i < formattedData.length; i += chunkSize) {
            const chunk = formattedData.slice(i, i + chunkSize);
            const { error: insertError } = await supabase.from('inventory').insert(chunk);
            if (insertError) {
                throw new Error(`Failed to insert chunk starting at ${i}: ${insertError.message}`);
            }
            console.log(`Inserted chunk of ${chunk.length} items (${i + chunk.length}/${formattedData.length})...`);
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
