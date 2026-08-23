import React from 'react';

const baseStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    background: 'rgba(11,23,42,0.24)',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    animation: 'globalFeedbackOverlayIn 180ms ease-out'
  },

  modal: {
    width: '100%',
    maxWidth: '560px',
    position: 'relative',
    background: '#FFFFFF',
    border: '1px solid #DCE0E6',
    borderRadius: '18px',
    boxShadow: '0 28px 80px rgba(11,23,42,0.20)',
    padding: '30px',
    animation: 'globalFeedbackModalIn 220ms cubic-bezier(0.22, 1, 0.36, 1)'
  },

  close: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    width: '38px',
    height: '38px',
    border: 'none',
    borderRadius: '50%',
    background: 'transparent',
    color: '#111827',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '24px',
    lineHeight: 1
  },

  title: {
    margin: 0,
    paddingRight: '42px',
    color: '#111827',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '28px',
    lineHeight: 1.18,
    fontWeight: '500'
  },

  message: {
    margin: '18px 0 0',
    color: '#5F6772',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '16px',
    lineHeight: 1.55
  },

  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '28px'
  },

  secondaryButton: {
    minWidth: '104px',
    height: '44px',
    padding: '0 18px',
    border: '1px solid #D7DAE0',
    borderRadius: '999px',
    background: '#FFFFFF',
    color: '#111827',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  dangerButton: {
    minWidth: '166px',
    height: '44px',
    padding: '0 20px',
    border: 'none',
    borderRadius: '999px',
    background: '#D92D20',
    color: '#FFFFFF',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  primaryButton: {
    minWidth: '104px',
    height: '44px',
    padding: '0 20px',
    border: 'none',
    borderRadius: '999px',
    background: '#111111',
    color: '#FFFFFF',
    fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },

  iconCircle: {
    width: '48px',
    height: '48px',
    marginBottom: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: '600'
  }
};

const GlobalModalClose = ({ onClose }) => (
  <button type="button" onClick={onClose} style={baseStyles.close} aria-label="Close">
    ×
  </button>
);

export const ConsentModal = ({
  open,
  title = 'Are you sure?',
  message,
  onCancel,
  onConfirm,
  confirmText = 'Yes, Delete Account',
  loading = false
}) => {
  if (!open) return null;

  return (
    <div
      style={baseStyles.overlay}
      onMouseDown={event => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div role="dialog" aria-modal="true" style={baseStyles.modal}>
        <GlobalModalClose onClose={loading ? undefined : onCancel} />
        <h2 style={baseStyles.title}>{title}</h2>
        <p style={baseStyles.message}>{message}</p>

        <div style={baseStyles.footer}>
          <button type="button" onClick={onCancel} disabled={loading} style={{ ...baseStyles.secondaryButton, ...(loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} style={{ ...baseStyles.dangerButton, ...(loading ? { opacity: 0.65, cursor: 'wait' } : {}) }}>
            {loading ? 'Deleting…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const SuccessModal = ({
  open,
  title = 'Success',
  message,
  onClose,
  buttonText = 'Continue'
}) => {
  if (!open) return null;

  return (
    <div style={baseStyles.overlay}>
      <div role="dialog" aria-modal="true" style={baseStyles.modal}>
        <GlobalModalClose onClose={onClose} />
        <div style={{ ...baseStyles.iconCircle, background: '#ECFDF3', color: '#039855' }}>✓</div>
        <h2 style={baseStyles.title}>{title}</h2>
        <p style={baseStyles.message}>{message}</p>
        <div style={baseStyles.footer}>
          <button type="button" onClick={onClose} style={baseStyles.primaryButton}>{buttonText}</button>
        </div>
      </div>
    </div>
  );
};

export const ErrorModal = ({
  open,
  title = 'Something went wrong',
  message,
  onClose,
  buttonText = 'Close'
}) => {
  if (!open) return null;

  return (
    <div style={baseStyles.overlay}>
      <div role="dialog" aria-modal="true" style={baseStyles.modal}>
        <GlobalModalClose onClose={onClose} />
        <div style={{ ...baseStyles.iconCircle, background: '#FEF3F2', color: '#D92D20' }}>!</div>
        <h2 style={baseStyles.title}>{title}</h2>
        <p style={baseStyles.message}>{message}</p>
        <div style={baseStyles.footer}>
          <button type="button" onClick={onClose} style={baseStyles.primaryButton}>{buttonText}</button>
        </div>
      </div>
    </div>
  );
};

export const Toast = ({
  open,
  message,
  type = 'default',
  onClose,
  duration = 3000
}) => {
  React.useEffect(() => {
    if (!open || !duration) return undefined;
    const timer = window.setTimeout(() => onClose?.(), duration);
    return () => window.clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const typeStyles = {
    success: { background: '#111827', icon: '✓' },
    error: { background: '#B42318', icon: '!' },
    default: { background: '#111827', icon: 'i' }
  };

  const selected = typeStyles[type] || typeStyles.default;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: '28px',
        zIndex: 1100,
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        minHeight: '42px',
        maxWidth: 'min(520px, calc(100vw - 32px))',
        padding: '0 16px',
        borderRadius: '999px',
        background: selected.background,
        color: '#FFFFFF',
        boxShadow: '0 12px 35px rgba(11,23,42,0.18)',
        fontFamily: "'Titillium Web', Geneva, Tahoma, sans-serif",
        fontSize: '14px',
        fontWeight: '500',
        animation: 'globalFeedbackToastIn 200ms ease-out'
      }}
    >
      <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
        {selected.icon}
      </span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{message}</span>
    </div>
  );
};

if (typeof document !== 'undefined') {
  const styleId = 'global-feedback-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes globalFeedbackOverlayIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes globalFeedbackModalIn {
        from { opacity: 0; transform: translateY(10px) scale(0.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes globalFeedbackToastIn {
        from { opacity: 0; transform: translate(-50%, 8px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    document.head.appendChild(style);
  }
}
