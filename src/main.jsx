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

// Configurar actualización automática del Service Worker (PWA)
const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm("Nueva versión disponible. ¿Deseas actualizar la aplicación?")) {
            updateSW(true);
        }
    },
    onOfflineReady() {
        console.log("Aplicación lista para uso sin conexión");
    },
    immediate: true
});

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
