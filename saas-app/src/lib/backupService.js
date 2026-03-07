export const backupToSheets = async (sheetName, dataArray) => {
    const url = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;

    // Si la URL no está configurada, ignoramos la operación silenciosamente para no interrumpir
    if (!url || url.trim() === '') return;

    try {
        const payload = {
            sheet: sheetName,
            data: dataArray
        };

        // Usamos mode: no-cors y text/plain para evitar bloqueos del navegador hacia Apps Script
        fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload)
        }).catch(err => console.error("Error interno en backup invisible:", err));

    } catch (e) {
        console.error("Fallo general al intentar backup en Sheets", e);
    }
};
