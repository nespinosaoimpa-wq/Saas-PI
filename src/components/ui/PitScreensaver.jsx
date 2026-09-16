import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

export function PitScreensaver({ isOpen, onClose }) {
    const [time, setTime] = useState(new Date());
    const [rpm, setRpm] = useState(950);
    const [gear, setGear] = useState('N');
    const [shiftStep, setShiftStep] = useState(1);

    // Reloj digital en tiempo real
    useEffect(() => {
        if (!isOpen) return;
        const clockInterval = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(clockInterval);
    }, [isOpen]);

    // Simulación de ralentí y aceleración de motor V10 en boxes
    useEffect(() => {
        if (!isOpen) return;
        let angle = 0;
        const rpmInterval = setInterval(() => {
            angle += 0.08;
            // Oscilación natural entre 850 y 1600 RPM con aceleraditas ocasionales
            const base = 950 + Math.sin(angle) * 150 + Math.cos(angle * 2.3) * 80;
            const rev = (Math.sin(angle * 0.4) > 0.85) ? 1400 : 0;
            const currentRpm = Math.round(base + rev);
            setRpm(currentRpm);

            // Shift lights calculation (1 to 5)
            if (currentRpm < 950) setShiftStep(1);
            else if (currentRpm < 1100) setShiftStep(2);
            else if (currentRpm < 1300) setShiftStep(3);
            else if (currentRpm < 1800) setShiftStep(4);
            else setShiftStep(5);
        }, 60);

        return () => clearInterval(rpmInterval);
    }, [isOpen]);

    // Listener para salir con cualquier tecla o movimiento de mouse
    useEffect(() => {
        if (!isOpen) return;

        const handleInteraction = () => {
            onClose();
        };

        const timer = setTimeout(() => {
            window.addEventListener('mousemove', handleInteraction, { once: true });
            window.addEventListener('keydown', handleInteraction, { once: true });
            window.addEventListener('touchstart', handleInteraction, { once: true });
            window.addEventListener('click', handleInteraction, { once: true });
        }, 300); // Pequeño debounce para no cerrarlo de inmediato

        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const timeStr = time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = time.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    // Cálculo del tacómetro circular (0 - 8000 RPM)
    const maxRpm = 6000;
    const rpmPercent = Math.min(Math.max(rpm / maxRpm, 0), 1);
    const strokeDashoffset = 440 - (440 * (rpmPercent * 0.75));

    return (
        <div className="pit-screensaver-overlay" onClick={onClose}>
            {/* Fondo con luces de circuito difusas */}
            <div className="pit-screensaver-glow glow-1" />
            <div className="pit-screensaver-glow glow-2" />
            <div className="pit-screensaver-grid" />

            {/* Cabecera de Telemetría */}
            <div className="pit-screensaver-header">
                <div className="pit-screensaver-brand">
                    <span className="pit-brand-badge">SQUADRA CORSE</span>
                    <h2>VELOCCE <span>TELEMETRY HUD</span></h2>
                </div>
                <div className="pit-live-chip">
                    <span className="live-pulsar" />
                    <span>PIT STOP IDLE // BOX 1</span>
                </div>
            </div>

            {/* Tacómetro y Cockpit Central */}
            <div className="pit-screensaver-cockpit">
                {/* Shift Lights F1 */}
                <div className="pit-shift-lights">
                    <span className={`shift-led green ${shiftStep >= 1 ? 'on' : ''}`} />
                    <span className={`shift-led green ${shiftStep >= 2 ? 'on' : ''}`} />
                    <span className={`shift-led yellow ${shiftStep >= 3 ? 'on' : ''}`} />
                    <span className={`shift-led yellow ${shiftStep >= 4 ? 'on' : ''}`} />
                    <span className={`shift-led red ${shiftStep >= 5 ? 'on' : ''}`} />
                </div>

                {/* Dial de Tacómetro */}
                <div className="pit-tachometer">
                    <svg viewBox="0 0 200 200" className="pit-tach-svg">
                        <circle
                            cx="100"
                            cy="100"
                            r="70"
                            className="pit-tach-track"
                        />
                        <circle
                            cx="100"
                            cy="100"
                            r="70"
                            className="pit-tach-fill"
                            style={{ strokeDashoffset }}
                        />
                    </svg>

                    <div className="pit-tach-center">
                        <span className="pit-gear-indicator">{gear}</span>
                        <div className="pit-rpm-number">{rpm}</div>
                        <span className="pit-rpm-label">RPM • RALENTÍ</span>
                    </div>
                </div>

                {/* Reloj Gigante de Pista */}
                <div className="pit-clock-container">
                    <div className="pit-digital-time">{timeStr}</div>
                    <div className="pit-digital-date">{dateStr}</div>
                </div>

                {/* Parámetros de Telemetría */}
                <div className="pit-telemetry-readouts">
                    <div className="pit-readout-item">
                        <label>PRESIÓN ACEITE</label>
                        <strong>4.8 <span>BAR</span></strong>
                    </div>
                    <div className="pit-readout-divider" />
                    <div className="pit-readout-item">
                        <label>TEMP MOTOR</label>
                        <strong>92° <span>C</span></strong>
                    </div>
                    <div className="pit-readout-divider" />
                    <div className="pit-readout-item">
                        <label>BATERÍA</label>
                        <strong>14.2 <span>V</span></strong>
                    </div>
                </div>
            </div>

            {/* Footer / Aviso de Retorno */}
            <div className="pit-screensaver-footer">
                <div className="pit-exit-prompt">
                    <Icon name="touch_app" size={18} />
                    <span>Mové el mouse, tocá la pantalla o cualquier tecla para acelerar</span>
                </div>
            </div>
        </div>
    );
}
