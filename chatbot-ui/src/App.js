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
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div style={styles.wrapper}>
      {!user && (
        <div style={styles.buttonGroup}>
          <button onClick={() => handlePageChange('signup')} style={styles.glowButton}>Signup</button>
          <button onClick={() => handlePageChange('login')} style={styles.glowButton}>Login</button>
          <button
            onClick={() => {
              setModalMessage('Please login first to use the chatbot.');
              setShowLoginModal(true);
            }}
            style={styles.glowButton}
          >
            Chatbot
          </button>
          <button
            onClick={() => {
              setModalMessage('Please login first to view lawyers section.');
              setShowLoginModal(true);
            }}
            style={styles.glowButton}
          >
            Lawyers Section
          </button>
        </div>
      )}

      {user && page === 'chatbot' && (
        <div style={styles.topRight}>
          <button onClick={() => handlePageChange('lawyers')} style={styles.glowButton}>Lawyers Section</button>
        </div>
      )}

      {user && page === 'lawyers' && (
        <div style={styles.topRight}>
          <button onClick={() => handlePageChange('chatbot')} style={styles.glowButton}>Chatbot</button>
          <button onClick={handleLogout} style={styles.glowButton}>Logout</button>
        </div>
      )}

      {user ? (
        <>
          {page === 'chatbot' && <Chatbot onLogout={handleLogout} />}
          {page === 'lawyers' && <Lawyers />}
        </>
      ) : (
        <>
          {page === 'signup' && <Signup onSignupComplete={() => setPage('login')} />}
          {page === 'login' && <Login onLoginSuccess={() => setPage('chatbot')} onForgotPassword={() => setPage('resetPassword')} />}
          {page === 'resetPassword' && <ResetPassword onBackToLogin={() => setPage('login')} />}
        </>
      )}

      {showLoginModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h2 style={styles.modalHeading}>Login Required</h2>
            <p style={styles.modalMessage}>{modalMessage}</p>
            <div style={styles.modalButtons}>
              <button onClick={() => setShowLoginModal(false)} style={styles.cancelBtn}>Cancel</button>
              <button onClick={() => {
                setShowLoginModal(false);
                setPage('login');
              }} style={styles.confirmBtn}>Login</button>
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
    background: 'transparent'
  },
  buttonGroup: {
    position: 'absolute',
    top: '20px',
    left: '50%',
    fontFamily: 'Jost',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '15px',
    zIndex: 10,
    alignItems: 'center'
  },
  topRight: {
    position: 'absolute',
    top: '20px',
    right: '30px',
    display: 'flex',
    gap: '15px',
    zIndex: 10,
    alignItems: 'center'
  },
  glowButton: {
    padding: '10px 25px',
    borderRadius: '30px',
    border: '1px solid #00f2ff',
    backgroundColor: '#111',
    color: '#00f2ff',
    fontWeight: 'bold',
    fontFamily: 'Saira',
    cursor: 'pointer',
    boxShadow: '0 0 20px #00f2ff',
    transition: 'all 0.3s ease',
    outline: 'none'
  },
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    animation: 'fadeInOverlay 0.3s ease forwards'
  },
  modalBox: {
    background: 'rgba(0, 0, 0, 0.75)',
    padding: '30px',
    borderRadius: '18px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 0 30px rgba(0, 242, 255, 0.2)',
    width: '90%',
    maxWidth: '400px',
    textAlign: 'center',
    fontFamily: 'Saira',
    opacity: 0,
    transform: 'translateY(-20px)',
    animation: 'fadeInModal 0.3s ease forwards 0.1s'
  },
  modalHeading: {
    color: '#ff4c4c',
    fontSize: '22px',
    marginBottom: '10px'
  },
  modalMessage: {
    color: '#fff',
    fontSize: '16px',
    marginBottom: '20px'
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Jost',
    fontWeight: 'bold'
  },
  confirmBtn: {
    padding: '10px 20px',
    backgroundColor: '#ff4c4c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontFamily: 'Jost',
    fontWeight: 'bold'
  }
};

export default App;