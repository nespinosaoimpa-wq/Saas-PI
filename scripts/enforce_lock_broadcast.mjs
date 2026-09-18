import WebSocket from 'ws';
global.WebSocket = WebSocket;
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oanurhkxqdxtqoauiizy.supabase.co';
const supabaseKey = 'sb_publishable_DlDSyq8nUsw5D-SkGd6dyw_9rULN-gE';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Iniciando Centinela de Bloqueo y Recarga Remota Continua...');

async function startSentinel() {
    const channel = supabase.channel('velocce-system-updates');

    channel.subscribe(async (status) => {
        console.log(`[Status Canal Realtime]: ${status}`);
        if (status === 'SUBSCRIBED') {
            console.log('✅ Conexión establecida. Transmitiendo ráfagas de recarga y corte...');
            
            let count = 0;
            const interval = setInterval(async () => {
                count++;
                try {
                    // 1. Enviar broadcast de recarga forzada por WebSocket
                    await channel.send({
                        type: 'broadcast',
                        event: 'force-reload',
                        payload: {
                            timestamp: new Date().toISOString(),
                            iteration: count,
                            action: 'KILL_SESSION_IMMEDIATELY',
                            reason: 'SUSPENSION_POR_FALTA_DE_PAGO'
                        }
                    });
                    console.log(`📡 [${new Date().toLocaleTimeString()}] Señal force-reload transmitida (#${count})`);

                    // 2. Cada 3 ráfagas (15 seg), registrar un pulso de corte en audit_logs para despertar el canal db-changes
                    if (count % 3 === 0) {
                        await supabase.from('audit_logs').insert([{
                            company_id: 'piripi',
                            action: 'REMOTE_LOCKOUT_TRIGGER',
                            path: '/lockout',
                            details: { enforced_at: new Date().toISOString() }
                        }]);
                    }
                } catch (err) {
                    console.error('Error en emisión:', err.message);
                }

                // Ejecutar durante 30 ciclos (2.5 minutos de ráfaga continua)
                if (count >= 30) {
                    console.log('🏁 Ráfaga continua completada exitosamente.');
                    clearInterval(interval);
                    process.exit(0);
                }
            }, 5000);
        }
    });
}

startSentinel();
