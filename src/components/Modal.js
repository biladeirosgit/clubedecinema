import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Renderiza o overlay no body (via portal), fora da grelha do catalogo, para
// escapar a qualquer stacking context dos cartoes e ficar sempre por cima.
const Modal = ({ onClose, children }) => {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return createPortal(
        <div
            className="modal"
            onClick={(e) => e.target.classList.contains('modal') && onClose()}
        >
            <div className="modal-content">
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
