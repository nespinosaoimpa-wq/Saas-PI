import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Icon } from './Icon';

export const CameraScanner = ({ onScan, onClose, mode = 'barcode' }) => {
    const scannerRef = useRef(null);
    const [html5Qrcode, setHtml5Qrcode] = useState(null);
    const [error, setError] = useState(null);
    const [scanMode, setScanMode] = useState(mode); // 'barcode' or 'plate'
    const [manualPlate, setManualPlate] = useState('');
    const [photoTaken, setPhotoTaken] = useState(null);

    useEffect(() => {
        if (scanMode === 'plate') return; // No auto-scanner for plate mode

        const qrCode = new Html5Qrcode("reader");
        setHtml5Qrcode(qrCode);

        qrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 280, height: 160 },
                aspectRatio: 1.0
            },
            (decodedText) => {
                onScan(decodedText);
            },
            () => { }
        ).catch((err) => {
            setError('Error al iniciar la cámara. Verificá los permisos del navegador.');
            console.error(err);
        });

        return () => {
            if (qrCode.isScanning) {
                qrCode.stop().then(() => qrCode.clear()).catch(console.error);
            }
        };
    }, [scanMode]);

    const handleClose = () => {
        if (html5Qrcode && html5Qrcode.isScanning) {
            html5Qrcode.stop().then(() => onClose()).catch(() => onClose());
        } else {
            onClose();
        }
    };

    const handleTakePhoto = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();

            // Wait a moment for the camera to focus
            await new Promise(r => setTimeout(r, 1500));

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            stream.getTracks().forEach(t => t.stop());

            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setPhotoTaken(dataUrl);
        } catch (e) {
            setError('No se pudo acceder a la cámara. Verificá los permisos.');
            console.error(e);
        }
    };

    const handleConfirmPlate = () => {
        if (manualPlate.trim()) {
            onScan(manualPlate.trim().toUpperCase());
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--bg-base)', zIndex: 10000,
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: 16, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)', flexShrink: 0
            }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                    <Icon name={scanMode === 'barcode' ? 'barcode_reader' : 'directions_car'} size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    {scanMode === 'barcode' ? 'Escanear Código de Barras' : 'Capturar Patente'}
                </h3>
                <button className="btn btn-ghost" onClick={handleClose}>
                    <Icon name="close" size={24} />
                </button>
            </div>

            {/* Mode Tabs */}
            <div style={{
                display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
                background: 'var(--bg-card)', flexShrink: 0
            }}>
                <button
                    onClick={() => setScanMode('barcode')}
                    style={{
                        flex: 1, padding: '12px 16px', border: 'none', cursor: 'pointer',
                        background: scanMode === 'barcode' ? 'var(--primary)' : 'transparent',
                        color: scanMode === 'barcode' ? 'white' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}>
                    <Icon name="barcode_reader" size={18} /> Código de Barras
                </button>
                <button
                    onClick={() => setScanMode('plate')}
                    style={{
                        flex: 1, padding: '12px 16px', border: 'none', cursor: 'pointer',
                        background: scanMode === 'plate' ? 'var(--primary)' : 'transparent',
                        color: scanMode === 'plate' ? 'white' : 'var(--text-muted)',
                        fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}>
                    <Icon name="directions_car" size={18} /> Patente
                </button>
            </div>

            {/* Scanner Area */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', overflow: 'hidden' }}>
                {error && <div style={{ color: 'var(--danger)', padding: 16, textAlign: 'center', background: 'rgba(239,68,68,0.1)', borderRadius: 8, margin: 16 }}>{error}</div>}

                {scanMode === 'barcode' && (
                    <>
                        <div id="reader" ref={scannerRef} style={{ width: '100%', maxWidth: 400, border: 'none' }} />
                        <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none' }}>
                            <p style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontSize: 14 }}>
                                📷 Apuntá la cámara al código de barras
                            </p>
                        </div>
                    </>
                )}

                {scanMode === 'plate' && (
                    <div style={{ width: '100%', maxWidth: 420, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                        {/* Photo preview */}
                        {photoTaken ? (
                            <div style={{ position: 'relative', width: '100%' }}>
                                <img src={photoTaken} alt="Patente" style={{ width: '100%', borderRadius: 12, border: '2px solid var(--primary)' }} />
                                <button className="btn btn-ghost btn-sm" onClick={() => setPhotoTaken(null)}
                                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                                    <Icon name="refresh" size={18} /> Reintentar
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                width: '100%', aspectRatio: '16/9', borderRadius: 12,
                                border: '2px dashed var(--border-hover)', display: 'flex',
                                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(255,255,255,0.05)', cursor: 'pointer'
                            }} onClick={handleTakePhoto}>
                                <Icon name="photo_camera" size={48} style={{ color: 'var(--primary)', marginBottom: 12 }} />
                                <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Tomar Foto de la Patente</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>La cámara se encenderá brevemente</div>
                            </div>
                        )}

                        {/* Manual Input */}
                        <div style={{ width: '100%', background: 'var(--bg-card)', borderRadius: 12, padding: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                                Ingresá la patente manualmente
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={manualPlate}
                                    onChange={e => setManualPlate(e.target.value.toUpperCase())}
                                    placeholder="Ej: AB 123 CD"
                                    style={{ flex: 1, fontSize: 20, fontWeight: 800, textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase' }}
                                    maxLength={10}
                                    autoFocus
                                />
                                <button className="btn btn-primary" onClick={handleConfirmPlate} disabled={!manualPlate.trim()}
                                    style={{ padding: '0 20px', height: 48 }}>
                                    <Icon name="check" size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
