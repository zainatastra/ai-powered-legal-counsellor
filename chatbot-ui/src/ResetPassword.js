// src/ResetPassword.js
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';

const ResetPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('✅ Password reset link sent! Please check your email.');
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <form onSubmit={handleReset} style={styles.form}>
        <h2 style={styles.heading}>Reset Password</h2>
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Send Reset Link</button>
        {message && <p style={styles.message}>{message}</p>}
        <button onClick={onBackToLogin} style={styles.backButton}>← Back to Login</button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    fontFamily: 'Saira',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundImage: `url(${process.env.PUBLIC_URL}/background.png)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    overflow: 'hidden'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 0
  },
  form: {
    zIndex: 1,
    backgroundColor: '#0f0f0f',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 0 25px #00f2ff',
    display: 'flex',
    flexDirection: 'column',
    width: '300px'
  },
  heading: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid #00f2ff',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  button: {
    padding: '12px',
    backgroundColor: '#00f2ff',
    color: '#000',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'Saira',
    cursor: 'pointer'
  },
  backButton: {
    marginTop: '10px',
    background: 'transparent',
    color: '#00f2ff',
    border: 'none',
    fontFamily: 'Saira',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  message: {
    marginTop: '10px',
    color: '#fff',
    textAlign: 'center'
  }
};

export default ResetPassword;
