import React from 'react';
import { Icon } from './Icon';

export const Modal = ({ title, children, onClose, footer, width }) => (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-box" style={width ? { maxWidth: width } : {}}>
            <div className="modal-header">
                <h3>{title}</h3>
                <button className="btn btn-icon btn-ghost" onClick={onClose} style={{ width: 32, height: 32 }}><Icon name="close" size={18} /></button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
        </div>
    </div>
);
