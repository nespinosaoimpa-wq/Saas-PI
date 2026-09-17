import WebSocket from 'ws';
global.WebSocket = WebSocket;
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oanurhkxqdxtqoauiizy.supabase.co';
const supabaseKey = 'sb_publishable_DlDSyq8nUsw5D-SkGd6dyw_9rULN-gE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function forceReloadAll() {
    console.log('Enviando orden de actualización forzada a todas las terminales conectadas...');
    const channel = supabase.channel('velocce-system-updates');
    
    await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            console.log('Conectado al canal realtime. Transmitiendo mensaje de recarga forzada...');
            await channel.send({
                type: 'broadcast',
                event: 'force-reload',
                payload: {
                    timestamp: new Date().toISOString(),
                    version: '9.9.9',
                    reason: 'Bloqueo definitivo de seguridad por falta de pago'
                }
            });
            console.log('✅ Señal transmitida con éxito.');
            setTimeout(() => process.exit(0), 1500);
        }
    });
}

forceReloadAll();
