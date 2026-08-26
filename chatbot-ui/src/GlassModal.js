import React from 'react';
import { ShieldAlert, X, LogIn } from 'lucide-react';

const BRAND_NAME = 'AI Legal Counsellor';

const GlassModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div role="dialog" aria-modal="true" aria-labelledby="glass-modal-title" className="modal-surface gm-surface">
        <div className="modal-brand" style={{ justifyContent: 'center' }}>
          <img src="/logo.png" alt={BRAND_NAME} />
          <span>{BRAND_NAME}</span>
        </div>

        <div className="modal-icon-circle brand gm-icon">
          <ShieldAlert size={22} strokeWidth={1.8} />
        </div>

        <div className="modal-eyebrow">Access required</div>

        <h2 id="glass-modal-title" className="modal-title">Login required</h2>

        <p className="modal-message">{message}</p>

        <div className="gm-buttons">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            <X size={16} strokeWidth={1.9} />
            <span>Cancel</span>
          </button>

          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            <LogIn size={16} strokeWidth={1.9} />
            <span>Login</span>
          </button>
        </div>
      </div>

      <style>{`
        .gm-surface {
          text-align: center;
        }

        .gm-icon {
          margin-left: auto;
          margin-right: auto;
        }

        .gm-surface .modal-title {
          padding-right: 0;
        }

        .gm-surface .modal-message {
          max-width: 340px;
          margin-left: auto;
          margin-right: auto;
        }

        .gm-buttons {
          display: flex;
          justify-content: center;
          gap: var(--space-3);
          margin-top: var(--space-6);
        }

        @media (max-width: 480px) {
          .gm-buttons {
            flex-direction: column-reverse;
          }

          .gm-buttons .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default GlassModal;
