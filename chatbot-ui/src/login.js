// src/Login.js
import React, { useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = ({ onLoginSuccess, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage('✅ Logged in successfully!');
      if (onLoginSuccess) {
        onLoginSuccess(); 
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2 style={styles.heading}>Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          required
        />
        <div style={styles.passwordContainer}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...styles.input, paddingRight: '40px' }}
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            {showPassword ? '🙈' : '👁️'}
          </span>
        </div>

        <p
          onClick={onForgotPassword}
          style={styles.forgotText}
        >
          Forgot Password?
        </p>

        <button type="submit" style={styles.button}>Login</button>
        {message && <p style={styles.message}>{message}</p>}
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
    fontFamily: 'Saira',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  passwordContainer: {
    position: 'relative'
  },
  eyeIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    color: '#00f2ff',
    fontSize: '18px'
  },
  forgotText: {
    color: '#00f2ff',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'right',
    marginTop: '-10px',
    marginBottom: '10px',
    textDecoration: 'underline'
  },
  button: {
    padding: '12px',
    backgroundColor: '#00f2ff',
    color: '#000',
    fontWeight: 'bold',
    border: 'none',
    fontFamily: 'Jost',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  message: {
    marginTop: '10px',
    color: '#fff',
    textAlign: 'center'
  }
};

export default Login;