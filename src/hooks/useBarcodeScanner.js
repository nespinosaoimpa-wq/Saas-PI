import { useEffect, useRef } from 'react';

export const useBarcodeScanner = (onScan, options = {}) => {
    const {
        timeout = 50, // Max ms between keystrokes to be considered a scanner
        minLength = 4, // Min length of a barcode
    } = options;

    const buffer = useRef('');
    const lastKeyTime = useRef(0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if focus is inside an input/textarea to not interrupt normal typing
            // EXCEPT if we really want it. For now, let's allow it but be careful.
            const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';

            const currentTime = performance.now();

            // Si pasó mucho tiempo, no es un scanner (es alguien escribiendo)
            if (currentTime - lastKeyTime.current > timeout) {
                buffer.current = '';
            }

            // Si apretó Enter y hay algo en el buffer, probamos si es un barcode
            if (e.key === 'Enter') {
                if (buffer.current.length >= minLength) {
                    // Evitar que el "Enter" haga submit de algún form sin querer
                    if (!isInput) e.preventDefault();
                    onScan(buffer.current);
                }
                buffer.current = ''; // Reseteamos
            } else if (e.key.length === 1) { // Es un caracter válido
                buffer.current += e.key;
            }

            lastKeyTime.current = currentTime;
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onScan, timeout, minLength]);
};
