import React, { useState, useEffect } from 'react';
import Signup from './Signup';
import Login from './login';
import Chatbot from './chatbot';
import Lawyers from './Lawyers';
import ResetPassword from './ResetPassword';
import Loading from './Loading';
import { Scale } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [page, setPage] = useState('signup');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authTransition, setAuthTransition] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loadingVariant, setLoadingVariant] = useState('session');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        setPage('chatbot');
      } else {
        setPage('signup');
      }

      // Firebase has finished restoring the persisted authentication state.
      // Do not render either the auth screen or chatbot before this point.
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');

    if (confirmLogout) {
      setLoadingVariant('session');
      setLoading(true);
      setPage('login');

      await signOut(auth);
      setUser(null);

      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handlePageChange = (newPage) => {
    setLoadingVariant(newPage === 'lawyers' ? 'lawyers' : newPage === 'chatbot' ? 'chatbot' : 'auth');
    setLoading(true);

    setTimeout(() => {
      setPage(newPage);
      setLoading(false);
    }, 450);
  };

  const handleAuthSwitch = (newPage) => {
    if (newPage === page || authTransition) return;

    setAuthTransition(true);

    setTimeout(() => {
      setPage(newPage);
      requestAnimationFrame(() => {
        setAuthTransition(false);
      });
    }, 170);
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

      @keyframes authScreenEnter {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .alc-auth-area {
        transition: opacity 170ms ease, transform 170ms ease;
        will-change: opacity, transform;
      }

      .alc-auth-area.is-switching {
        opacity: 0;
        transform: translateY(-7px);
      }

      .alc-auth-screen {
        animation: authScreenEnter 280ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .alc-pill-button {
        transition:
          transform 180ms ease,
          box-shadow 180ms ease,
          background 180ms ease,
          border-color 180ms ease;
      }

      .alc-pill-button:hover {
        transform: translateY(-1px);
      }

      .alc-pill-button:active {
        transform: translateY(0);
      }

      .alc-secondary-button:hover {
        background: #F0F2F5 !important;
        border-color: #CCD4DF !important;
      }

      .alc-primary-button:hover {
        background: #172A46 !important;
        box-shadow: 0 10px 24px rgba(13, 31, 55, 0.18);
      }
    `;

    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  // Wait for Firebase to restore the persisted session before rendering
  // anything. This prevents the login/register screen from flashing briefly
  // when an already-authenticated user reloads the page.
  if (!authReady) {
    return <Loading variant={auth.currentUser ? 'chatbot' : 'session'} />;
  }

  if (loading) {
    return <Loading variant={loadingVariant} />;
  }

  return (
    <div style={styles.wrapper}>
      {user && page === 'chatbot' && (
        <div style={styles.topRight}>
          <button
            onClick={() => handlePageChange('lawyers')}
            style={styles.glowButton}
            className="alc-pill-button"
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
            className="alc-pill-button"
          >
            Legal Assistant
          </button>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            className="alc-pill-button"
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
        <div
          style={styles.authArea}
          className={`alc-auth-area${authTransition ? ' is-switching' : ''}`}
        >
          {page === 'signup' && (
            <div key="signup-screen" className="alc-auth-screen">
            <Signup
              onSignupComplete={() => handleAuthSwitch('login')}
              onSwitchToLogin={() => handleAuthSwitch('login')}
            />
            </div>
          )}

          {page === 'login' && (
            <div key="login-screen" className="alc-auth-screen">
            <Login
              onLoginSuccess={() => setPage('chatbot')}
              onForgotPassword={() => handleAuthSwitch('resetPassword')}
              onSwitchToSignup={() => handleAuthSwitch('signup')}
            />
            </div>
          )}

          {page === 'resetPassword' && (
            <div key="reset-screen" className="alc-auth-screen">
            <ResetPassword
              onBackToLogin={() => handleAuthSwitch('login')}
            />
            </div>
          )}
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
    color: '#10243E',
    fontFamily: 'Saira, sans-serif'
  },

  authArea: {
    minHeight: '100vh',
    width: '100%'
  },

  topRight: {
    position: 'absolute',
    top: '20px',
    right: '28px',
    display: 'flex',
    gap: '10px',
    zIndex: 10,
    alignItems: 'center',
    padding: '7px',
    background: 'rgba(255, 255, 255, 0.90)',
    border: '1px solid rgba(13, 31, 55, 0.09)',
    borderRadius: '999px',
    boxShadow: '0 8px 30px rgba(13, 31, 55, 0.08)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)'
  },

  glowButton: {
    minHeight: '42px',
    padding: '0 20px',
    borderRadius: '999px',
    border: '1px solid #D8DEE8',
    background: '#FFFFFF',
    color: '#172A46',
    fontWeight: '600',
    fontSize: '14px',
    fontFamily: 'Saira, sans-serif',
    cursor: 'pointer',
    boxShadow: 'none',
    outline: 'none'
  },

  logoutButton: {
    minHeight: '42px',
    padding: '0 20px',
    borderRadius: '999px',
    border: '1px solid #E4CFC8',
    background: '#FFF9F7',
    color: '#8F3F32',
    fontWeight: '600',
    fontSize: '14px',
    fontFamily: 'Saira, sans-serif',
    cursor: 'pointer',
    boxShadow: 'none',
    outline: 'none'
  }
};

export default App;
