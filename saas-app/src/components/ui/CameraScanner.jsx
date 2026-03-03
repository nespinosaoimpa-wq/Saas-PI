import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Icon } from './Icon';

export const CameraScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);
    const [html5Qrcode, setHtml5Qrcode] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Create instance
        const qrCode = new Html5Qrcode("reader");
        setHtml5Qrcode(qrCode);

        // Start scanning
        qrCode.start(
            { facingMode: "environment" }, // Prefer back camera
            {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0
            },
            (decodedText, decodedResult) => {
                // Ignore empty or fast duplicates by passing back immediately
                onScan(decodedText);
            },
            (errorMessage) => {
                // These are normal scanning failures (e.g. no code found in frame), ignore them typically
            }
        ).catch((err) => {
            setError('Error al iniciar la cámara. Verifique los permisos.');
            console.error(err);
        });

        return () => {
            if (qrCode.isScanning) {
                qrCode.stop().then(() => {
                    qrCode.clear();
                }).catch(console.error);
            }
        };
    }, []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-card)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0 }}>Escanear Código</h3>
                <button className="btn btn-ghost" onClick={() => {
                    if (html5Qrcode && html5Qrcode.isScanning) {
                        html5Qrcode.stop().then(() => onClose()).catch(() => onClose());
                    } else {
                        onClose();
                    }
                }}>
                    <Icon name="close" size={24} />
                </button>
            </div>

            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                {error && <div style={{ color: 'var(--danger)', padding: 16, textAlign: 'center' }}>{error}</div>}

                {/* Contenedor del scanner */}
                <div id="reader" ref={scannerRef} style={{ width: '100%', maxWidth: 400, border: 'none' }} />

                <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                    <p style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontSize: 14 }}>Apunta la cámara hacia el código de barras</p>
                </div>
            </div>
        </div>
    );
};
