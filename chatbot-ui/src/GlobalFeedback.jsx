import React from 'react';

/*
 * Shared feedback system: ConsentModal, SuccessModal, ErrorModal, Toast.
 * All visual styling now comes from the shared classes defined once in
 * index.css (.btn, .modal-overlay, .modal-surface, .toast, etc.) so this
 * file only wires up structure/behavior, not one-off styles.
 * Props/behavior are unchanged from the previous implementation.
 */

const BRAND_NAME = 'AI Legal Counsellor';

const BrandRow = () => (
  <div className="modal-brand">
    <img src="/logo.png" alt={BRAND_NAME} />
    <span>{BRAND_NAME}</span>
  </div>
);

const GlobalModalClose = ({ onClose, disabled }) => (
  <button
    type="button"
    onClick={onClose}
    disabled={disabled}
    className="icon-btn"
    style={{ position: 'absolute', top: '14px', right: '14px' }}
    aria-label="Close"
  >
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
      className="modal-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="gf-consent-title" className="modal-surface">
        <GlobalModalClose onClose={onCancel} disabled={loading} />
        <BrandRow />
        <h2 id="gf-consent-title" className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>

        <div className="modal-footer">
          <button type="button" onClick={onCancel} disabled={loading} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="btn btn-danger">
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
    <div className="modal-overlay">
      <div role="dialog" aria-modal="true" aria-labelledby="gf-success-title" className="modal-surface">
        <GlobalModalClose onClose={onClose} />
        <BrandRow />
        <div className="modal-icon-circle success">✓</div>
        <h2 id="gf-success-title" className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-primary">{buttonText}</button>
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
    <div className="modal-overlay">
      <div role="dialog" aria-modal="true" aria-labelledby="gf-error-title" className="modal-surface">
        <GlobalModalClose onClose={onClose} />
        <BrandRow />
        <div className="modal-icon-circle error">!</div>
        <h2 id="gf-error-title" className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-primary">{buttonText}</button>
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

  const icons = { success: '✓', error: '!', default: 'i' };
  const typeClass = type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : '';

  return (
    <div role="status" className={`toast ${typeClass}`}>
      <span className="toast-icon">{icons[type] || icons.default}</span>
      <span className="toast-text">{message}</span>
    </div>
  );
};
