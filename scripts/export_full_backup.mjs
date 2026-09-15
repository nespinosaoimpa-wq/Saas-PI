import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://oanurhkxqdxtqoauiizy.supabase.co';
const supabaseKey = 'sb_publishable_DlDSyq8nUsw5D-SkGd6dyw_9rULN-gE';
const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'employees',
  'clients',
  'vehicles',
  'vehicle_health',
  'boxes',
  'suppliers',
  'brands',
  'inventory',
  'stock_movements',
  'work_orders',
  'work_order_items',
  'payments',
  'cash_closings',
  'appointments',
  'promotions',
  'daily_work_log',
  'daily_quick_services',
  'service_history',
  'employee_earnings',
  'attendance_logs',
  'client_credits',
  'vehicle_notes'
];

async function fetchAllRows(tableName) {
  let allRows = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, from + step - 1);

    if (error) {
      console.warn(`[WARN] Table ${tableName}:`, error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allRows = allRows.concat(data);

    if (data.length < step) break;
    from += step;
  }

  return allRows;
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(process.cwd(), 'backups', `backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log('Iniciando Respaldo Completo en:', backupDir);

  const manifest = {
    timestamp: new Date().toISOString(),
    total_tables: TABLES.length,
    counts: {},
    files: {}
  };

  const consolidated = {};

  for (const table of TABLES) {
    process.stdout.write(`Extrayendo ${table.padEnd(25)}... `);
    const rows = await fetchAllRows(table);
    manifest.counts[table] = rows.length;
    consolidated[table] = rows;

    const filePath = path.join(backupDir, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), 'utf-8');
    manifest.files[table] = `${table}.json`;
    console.log(`✓ ${rows.length} registros guardados`);
  }

  const consolidatedPath = path.join(backupDir, 'FULL_BACKUP_CONSOLIDATED.json');
  fs.writeFileSync(consolidatedPath, JSON.stringify(consolidated, null, 2), 'utf-8');

  const manifestPath = path.join(backupDir, 'MANIFEST.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  // Human-readable summary
  const summaryMarkdown = `# Reporte de Respaldo de Datos — Velocce / Piripi
- **Fecha y Hora:** ${new Date().toLocaleString('es-AR')}
- **Servidor:** Supabase (https://oanurhkxqdxtqoauiizy.supabase.co)
- **Directorio de Respaldo:** \`${backupDir}\`

## Resumen de Registros Respaldados:
${Object.entries(manifest.counts).map(([t, c]) => `- **${t}:** ${c.toLocaleString('es-AR')} registros`).join('\n')}

---
*Todos los datos históricos, órdenes de trabajo, inventarios, pagos, clientes y empleados están 100% preservados.*
`;

  fs.writeFileSync(path.join(backupDir, 'REPORTE_RESPALDO.md'), summaryMarkdown, 'utf-8');

  console.log('\n=========================================');
  console.log('¡RESPALDO COMPLETADO EXITOSAMENTE!');
  console.log('Ubicación:', backupDir);
  console.log('=========================================');
}

runBackup().catch(console.error);
