import React from 'react';

/**
 * ErrorBoundary — Captura errores de renderizado de React
 * Previene la "pantalla azul" mostrando un mensaje amigable
 * con opción de recargar la app.
 */
export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('🔴 ErrorBoundary capturó un error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0c1222',
                    color: 'white',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    textAlign: 'center',
                    padding: 32
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 16,
                        background: 'linear-gradient(135deg, #6366f1, #0df2f2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 24, fontSize: 36
                    }}>
                        ⚠️
                    </div>
                    <h1 style={{ margin: '0 0 8px', fontSize: 24 }}>
                        PIRIPI <strong>PRO</strong>
                    </h1>
                    <p style={{ color: '#94a3b8', marginBottom: 24, maxWidth: 400 }}>
                        Ocurrió un error inesperado. Por favor, recargá la aplicación.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 32px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                            color: 'white',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Recargar Aplicación
                    </button>
                    <details style={{ marginTop: 24, color: '#64748b', fontSize: 12, maxWidth: 500, textAlign: 'left' }}>
                        <summary style={{ cursor: 'pointer' }}>Detalle técnico</summary>
                        <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {this.state.error?.toString()}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}
