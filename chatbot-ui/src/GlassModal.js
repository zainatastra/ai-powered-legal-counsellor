// src/GlassModal.js
import React from 'react';

const GlassModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.heading}>Login Required</h2>
        <p style={styles.text}>{message}</p>
        <div style={styles.buttonGroup}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>Login</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, width: '100%', height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(15px)',
    WebkitBackdropFilter: 'blur(15px)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modal: {
    background: 'rgba(18,18,18,0.8)',
    borderRadius: '18px',
    padding: '30px 40px',
    boxShadow: '0 0 30px rgba(0, 242, 255, 0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center',
    color: '#fff',
    width: '90%',
    maxWidth: '400px',
    fontFamily: 'Saira'
  },
  heading: {
    fontSize: '24px',
    marginBottom: '10px',
    color: '#ff4c4c'
  },
  text: {
    fontSize: '16px',
    marginBottom: '20px'
  },
  buttonGroup: {
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

export default GlassModal;
