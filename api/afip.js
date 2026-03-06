import Afip from '@afipsdk/afip.js';

export default async function handler(req, res) {
    // Enable CORS for development
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { amount, docType = 99, docNumber = 0, billType = 6 } = req.body;

        // Inicializar SDK en entorno de Pruebas (Homologación)
        // Por defecto afip.js genera certificados de prueba propios.
        const afip = new Afip({ CUIT: 20409378472, production: false });

        const date = new Date(Date.now() - ((new Date()).getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const dateStr = date.replace(/-/g, '');

        // billType: 1 = Factura A, 6 = Factura B, 11 = Factura C
        const cbteTipo = parseInt(billType);
        const ptoVta = 1; // Punto de venta 1

        const lastVoucher = await afip.ElectronicBilling.getLastVoucher(ptoVta, cbteTipo);
        const nextVoucher = lastVoucher + 1;

        // AFIP amount formatting (must be very precise)
        const totalAmount = parseFloat(amount);
        let impNeto = totalAmount;
        let impIVA = 0;

        // Si es Factura A o B (RI), debemos discriminar o asignar IVA.
        // Asumiendo tarifa general 21% (Si los precios ya tienen IVA incluido)
        if (cbteTipo === 1 || cbteTipo === 6) {
            impNeto = Number((totalAmount / 1.21).toFixed(2));
            impIVA = Number((totalAmount - impNeto).toFixed(2));
        }

        const iva = cbteTipo === 11 ? [] : [
            {
                'Id': 5, // 5 = 21%
                'BaseImp': impNeto,
                'Importe': impIVA
            }
        ];

        const data = {
            'CantReg': 1,
            'PtoVta': ptoVta,
            'CbteTipo': cbteTipo,
            'Concepto': 3, // Productos y Servicios
            'DocTipo': parseInt(docType),
            'DocNro': parseInt(docNumber),
            'CbteDesde': nextVoucher,
            'CbteHasta': nextVoucher,
            'CbteFch': parseInt(dateStr),
            'ImpTotal': totalAmount,
            'ImpTotConc': 0,
            'ImpNeto': impNeto,
            'ImpOpEx': 0,
            'ImpIVA': impIVA,
            'ImpTrib': 0,
            'MonId': 'PES',
            'MonCotiz': 1,
            'FchServDesde': parseInt(dateStr),
            'FchServHasta': parseInt(dateStr),
            'FchVtoPago': parseInt(dateStr),
            ...(cbteTipo !== 11 && { 'Iva': iva }) // Add VAT if not C
        };

        const resAFIP = await afip.ElectronicBilling.createVoucher(data);

        return res.status(200).json({
            success: true,
            cae: resAFIP.CAE,
            caeDueDate: resAFIP.CAEFchVto,
            voucherNumber: nextVoucher,
            receiptText: `${cbteTipo === 1 ? 'A' : (cbteTipo === 6 ? 'B' : 'C')} ${String(ptoVta).padStart(4, '0')}-${String(nextVoucher).padStart(8, '0')}`
        });

    } catch (error) {
        console.error('AFIP ERROR:', error);
        return res.status(500).json({ success: false, error: error.message || 'Error interno al conectar con AFIP' });
    }
}
