import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// Proteccion contra fallas de traductor automatico de Google Translate (removeChild / insertBefore Node Error)
if (typeof Node !== 'undefined' && Node.prototype) {
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function (child) {
        if (child.parentNode !== this) {
            if (console) console.warn('Google Translate DOM patch: parent is not the current node', child);
            return child;
        }
        return originalRemoveChild.apply(this, arguments);
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (newNode, referenceNode) {
        if (referenceNode && referenceNode.parentNode !== this) {
            if (console) console.warn('Google Translate DOM patch: reference node parent is not the current node', referenceNode);
            return newNode;
        }
        return originalInsertBefore.apply(this, arguments);
    };
}

// Configurar actualización automática del Service Worker (PWA) sin bloqueos
const updateSW = registerSW({
    onNeedRefresh() {
        console.log("[PWA] Nueva versión disponible en el servidor. Actualizando automáticamente...");
        updateSW(true);
    },
    onOfflineReady() {
        console.log("Aplicación lista para uso sin conexión");
    },
    immediate: true
});

// Chequeo periódico automático de Service Worker cada 30 segundos y al cambiar de pestaña
if (typeof window !== 'undefined') {
    setInterval(async () => {
        try {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) {
                    await reg.update();
                }
            }
        } catch (e) {}
    }, 30000);

    window.addEventListener('focus', async () => {
        try {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) {
                    await reg.update();
                }
            }
        } catch (e) {}
    });
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <AuthProvider>
                <AppProvider>
                    <App />
                </AppProvider>
            </AuthProvider>
        </ErrorBoundary>
    </React.StrictMode>,
);
