export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body || {};
        console.log('🔔 [MEMBERSHIP NOTIFICATION API] Recibida inscripción:', body);

        // Forward to FormSubmit or email channel
        try {
            await fetch('https://formsubmit.co/ajax/tic.espinosa@gmail.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    _subject: `🔔 INSCRIPCIÓN DE MEMBRESÍA: ${body.empresa || 'PIRIPI'}`,
                    ...body
                })
            });
        } catch (e) {
            console.warn('FormSubmit backup dispatch warning:', e.message);
        }

        return res.status(200).json({ success: true, message: 'Notificación procesada correctamente.' });
    } catch (err) {
        console.error('Error procesando notificación:', err);
        return res.status(500).json({ error: err.message });
    }
}
