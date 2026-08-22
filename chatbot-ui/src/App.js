import React, { useState, useEffect } from 'react';
import Signup from './Signup';
import Login from './login';
import Chatbot from './chatbot';
import Lawyers from './Lawyers';
import ResetPassword from './ResetPassword';
import Loading from './Loading';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [page, setPage] = useState('signup');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setPage('chatbot');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      setLoading(true);
      setPage('login');
      await signOut(auth);
      setUser(null);
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handlePageChange = (newPage) => {
    setLoading(true);
    setTimeout(() => {
      setPage(newPage);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeInOverlay {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fadeInModal {
        from { opacity: 0; transform: translateY(12px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .alc-nav-button {
        transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease, border-color 180ms ease;
      }

      .alc-nav-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(13, 31, 55, 0.16);
      }

      .alc-nav-button:active {
        transform: translateY(0);
      }

      .alc-secondary-button:hover {
        background: #eef2f7 !important;
        border-color: #cbd5e1 !important;
      }

      .alc-primary-button:hover {
        background: #172a46 !important;
        box-shadow: 0 8px 20px rgba(13, 31, 55, 0.18);
      }
    `;
    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.wrapper}>
      {!user && (
        <div style={styles.buttonGroup}>
          <button
            onClick={() => handlePageChange('signup')}
            style={styles.glowButton}
            className="alc-nav-button"
          >
            Sign up
          </button>

          <button
            onClick={() => handlePageChange('login')}
            style={styles.glowButton}
            className="alc-nav-button"
          >
            Log in
          </button>

          <button
            onClick={() => {
              setModalMessage('Please log in first to use the legal assistant.');
              setShowLoginModal(true);
            }}
            style={styles.glowButton}
            className="alc-nav-button"
          >
            Legal Assistant
          </button>

          <button
            onClick={() => {
              setModalMessage('Please log in first to view the lawyers section.');
              setShowLoginModal(true);
            }}
            style={styles.glowButton}
            className="alc-nav-button"
          >
            Lawyers
          </button>
        </div>
      )}

      {user && page === 'chatbot' && (
        <div style={styles.topRight}>
          <button
            onClick={() => handlePageChange('lawyers')}
            style={styles.glowButton}
            className="alc-nav-button"
          >
            Lawyers
          </button>
        </div>
      )}

      {user && page === 'lawyers' && (
        <div style={styles.topRight}>
          <button
            onClick={() => handlePageChange('chatbot')}
            style={styles.glowButton}
            className="alc-nav-button"
          >
            Legal Assistant
          </button>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            className="alc-nav-button"
          >
            Sign out
          </button>
        </div>
      )}

      {user ? (
        <>
          {page === 'chatbot' && <Chatbot onLogout={handleLogout} />}
          {page === 'lawyers' && <Lawyers />}
        </>
      ) : (
        <>
          {page === 'signup' && (
            <Signup onSignupComplete={() => setPage('login')} />
          )}

          {page === 'login' && (
            <Login
              onLoginSuccess={() => setPage('chatbot')}
              onForgotPassword={() => setPage('resetPassword')}
            />
          )}

          {page === 'resetPassword' && (
            <ResetPassword onBackToLogin={() => setPage('login')} />
          )}
        </>
      )}

      {showLoginModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalIcon}>⚖</div>

            <div style={styles.modalEyebrow}>ACCESS REQUIRED</div>

            <h2 style={styles.modalHeading}>Please log in</h2>

            <p style={styles.modalMessage}>{modalMessage}</p>

            <div style={styles.modalButtons}>
              <button
                onClick={() => setShowLoginModal(false)}
                style={styles.cancelBtn}
                className="alc-secondary-button"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setPage('login');
                }}
                style={styles.confirmBtn}
                className="alc-primary-button"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: 'relative',
    minHeight: '100vh',
    background: 'transparent',
    color: '#0d1f37',
    fontFamily: 'Saira, sans-serif'
  },

  buttonGroup: {
    position: 'absolute',
    top: '22px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '9px',
    zIndex: 10,
    alignItems: 'center',
    padding: '6px',
    background: 'rgba(255, 255, 255, 0.86)',
    border: '1px solid rgba(13, 31, 55, 0.09)',
    borderRadius: '14px',
    boxShadow: '0 8px 30px rgba(13, 31, 55, 0.08)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)'
  },

  topRight: {
    position: 'absolute',
    top: '20px',
    right: '28px',
    display: 'flex',
    gap: '9px',
    zIndex: 10,
    alignItems: 'center',
    padding: '6px',
    background: 'rgba(255, 255, 255, 0.88)',
    border: '1px solid rgba(13, 31, 55, 0.09)',
    borderRadius: '14px',
    boxShadow: '0 8px 30px rgba(13, 31, 55, 0.08)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)'
  },

  glowButton: {
    padding: '10px 17px',
    borderRadius: '9px',
    border: '1px solid #d8dee8',
    background: '#ffffff',
    color: '#172a46',
    fontWeight: '600',
    fontSize: '13px',
    fontFamily: 'Saira, sans-serif',
    letterSpacing: '0.1px',
    cursor: 'pointer',
    boxShadow: 'none',
    outline: 'none'
  },

  logoutButton: {
    padding: '10px 17px',
    borderRadius: '9px',
    border: '1px solid #e4cfc8',
    background: '#fff9f7',
    color: '#8f3f32',
    fontWeight: '600',
    fontSize: '13px',
    fontFamily: 'Saira, sans-serif',
    cursor: 'pointer',
    boxShadow: 'none',
    outline: 'none'
  },

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(8, 19, 34, 0.42)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    animation: 'fadeInOverlay 0.22s ease forwards',
    padding: '24px',
    boxSizing: 'border-box'
  },

  modalBox: {
    background: 'rgba(255, 255, 255, 0.97)',
    padding: '34px',
    borderRadius: '20px',
    border: '1px solid rgba(13, 31, 55, 0.08)',
    boxShadow: '0 24px 70px rgba(7, 20, 37, 0.22)',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
    fontFamily: 'Saira, sans-serif',
    color: '#172a46',
    opacity: 0,
    transform: 'translateY(12px) scale(0.98)',
    animation: 'fadeInModal 0.25s ease forwards 0.05s',
    boxSizing: 'border-box'
  },

  modalIcon: {
    width: '46px',
    height: '46px',
    margin: '0 auto 16px',
    borderRadius: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#eef2f7',
    color: '#b28a42',
    fontSize: '21px',
    border: '1px solid #e0e6ee'
  },

  modalEyebrow: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    color: '#8b97a8',
    marginBottom: '7px'
  },

  modalHeading: {
    color: '#10243e',
    fontSize: '24px',
    lineHeight: 1.2,
    fontWeight: '700',
    margin: '0 0 10px'
  },

  modalMessage: {
    color: '#667386',
    fontSize: '14px',
    lineHeight: 1.6,
    margin: '0 auto 24px',
    maxWidth: '330px'
  },

  modalButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px'
  },

  cancelBtn: {
    padding: '11px 22px',
    background: '#f7f8fa',
    color: '#405066',
    border: '1px solid #dce2e9',
    borderRadius: '9px',
    cursor: 'pointer',
    fontFamily: 'Saira, sans-serif',
    fontWeight: '600',
    fontSize: '13px'
  },

  confirmBtn: {
    padding: '11px 24px',
    background: '#10243e',
    color: '#fff',
    border: '1px solid #10243e',
    borderRadius: '9px',
    cursor: 'pointer',
    fontFamily: 'Saira, sans-serif',
    fontWeight: '600',
    fontSize: '13px'
  }
};

export default App;
