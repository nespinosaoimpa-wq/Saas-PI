import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

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
        <AuthProvider>
            <AppProvider>
                <App />
            </AppProvider>
        </AuthProvider>
    </React.StrictMode>,
);
