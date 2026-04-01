import { useState, useCallback, useRef } from 'react';

/**
 * useSubmitGuard — Hook anti doble-click para operaciones críticas.
 * 
 * Previene que una función async se ejecute más de una vez mientras
 * la primera ejecución aún está en curso.
 * 
 * Incluye un timeout de seguridad para evitar bloqueos permanentes.
 * 
 * @param {number} safetyTimeoutMs — Tiempo máximo de bloqueo (default: 15s)
 * @returns {{ isProcessing: boolean, guardedSubmit: (fn: () => Promise) => Promise }}
 */
export function useSubmitGuard(safetyTimeoutMs = 15000) {
    const [isProcessing, setIsProcessing] = useState(false);
    const lockRef = useRef(false);
    const timeoutRef = useRef(null);

    const guardedSubmit = useCallback(async (asyncFn) => {
        // Si ya se está procesando, bloquear silenciosamente
        if (lockRef.current) {
            console.warn('⚠️ Operación bloqueada: ya se está procesando una acción.');
            return;
        }

        lockRef.current = true;
        setIsProcessing(true);

        // Safety timeout: si algo sale mal, desbloquear después de N segundos
        timeoutRef.current = setTimeout(() => {
            console.warn('⚠️ Safety timeout: desbloqueando submit guard después de', safetyTimeoutMs, 'ms');
            lockRef.current = false;
            setIsProcessing(false);
        }, safetyTimeoutMs);

        try {
            await asyncFn();
        } catch (error) {
            // Re-throw para que el caller pueda manejar el error
            throw error;
        } finally {
            clearTimeout(timeoutRef.current);
            lockRef.current = false;
            setIsProcessing(false);
        }
    }, [safetyTimeoutMs]);

    return { isProcessing, guardedSubmit };
}
