import React from 'react';
import { ShieldAlert, X, LogIn } from 'lucide-react';

const GlassModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div style={styles.overlay}>
      <div className="legal-modal-box" style={styles.modal}>
        <div style={styles.icon}>
          <ShieldAlert size={24} strokeWidth={1.8} />
        </div>

        <div style={styles.eyebrow}>ACCESS REQUIRED</div>

        <h2 style={styles.heading}>Login required</h2>

        <p style={styles.text}>{message}</p>

        <div className="legal-modal-buttons" style={styles.buttonGroup}>
          <button
            style={styles.cancelBtn}
            className="glass-modal-cancel"
            onClick={onCancel}
          >
            <X size={17} strokeWidth={1.9} />
            <span>Cancel</span>
          </button>

          <button
            style={styles.confirmBtn}
            className="glass-modal-confirm"
            onClick={onConfirm}
          >
            <LogIn size={17} strokeWidth={1.9} />
            <span>Login</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes legalModalOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes legalModalEnter {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .glass-modal-cancel,
        .glass-modal-confirm {
          transition:
            background 180ms ease,
            border-color 180ms ease,
            color 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;
        }

        .glass-modal-cancel:hover {
          background: #EEF2F7 !important;
          border-color: #CBD5E1 !important;
          transform: translateY(-1px);
        }

        .glass-modal-confirm:hover {
          background: #172A46 !important;
          border-color: #172A46 !important;
          box-shadow: 0 8px 20px rgba(13, 31, 55, 0.18);
          transform: translateY(-1px);
        }

        .glass-modal-cancel:active,
        .glass-modal-confirm:active {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .legal-modal-box {
            padding: 28px 22px !important;
          }

          .legal-modal-buttons {
            flex-direction: column-reverse !important;
          }

          .legal-modal-buttons button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100vh',
    boxSizing: 'border-box',
    background: 'rgba(8, 19, 34, 0.42)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px',
    animation: 'legalModalOverlay 220ms ease forwards'
  },

  modal: {
    width: '90%',
    maxWidth: '430px',
    boxSizing: 'border-box',
    padding: '36px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.98)',
    border: '1px solid #E4DED4',
    boxShadow: '0 24px 70px rgba(7,20,37,0.22)',
    textAlign: 'center',
    color: '#172A46',
    fontFamily: "'Saira', 'Segoe UI', sans-serif",
    animation: 'legalModalEnter 250ms ease forwards 50ms'
  },

  icon: {
    width: '52px',
    height: '52px',
    margin: '0 auto 17px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F4F1E9',
    border: '1px solid #E7DDC8',
    color: '#B8924A'
  },

  eyebrow: {
    marginBottom: '8px',
    color: '#B8924A',
    fontFamily: "'Jost', sans-serif",
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.7px'
  },

  heading: {
    margin: '0 0 11px',
    color: '#10243E',
    fontFamily: "'Jost', sans-serif",
    fontSize: '27px',
    lineHeight: 1.2,
    fontWeight: '700',
    letterSpacing: '-0.5px'
  },

  text: {
    maxWidth: '340px',
    margin: '0 auto 26px',
    color: '#667386',
    fontSize: '15px',
    lineHeight: 1.6
  },

  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: '11px'
  },

  cancelBtn: {
    minWidth: '105px',
    height: '44px',
    padding: '0 18px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    background: '#F7F8FA',
    color: '#405066',
    border: '1px solid #DCE2E9',
    borderRadius: '9px',
    cursor: 'pointer',
    fontFamily: "'Jost', sans-serif",
    fontWeight: '600',
    fontSize: '14px'
  },

  confirmBtn: {
    minWidth: '105px',
    height: '44px',
    padding: '0 18px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    background: '#10243E',
    color: '#FFFFFF',
    border: '1px solid #10243E',
    borderRadius: '9px',
    cursor: 'pointer',
    fontFamily: "'Jost', sans-serif",
    fontWeight: '600',
    fontSize: '14px'
  }
};

export default GlassModal;
