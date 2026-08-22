// src/Loading.js
import React from 'react';

const Loading = () => {
  return (
    <div style={styles.loaderWrapper}>
      <div style={styles.loader}></div>
    </div>
  );
};

const styles = {
  loaderWrapper: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #0f5fe8, #4a00e0)',
    zIndex: 9999
  },
  loader: {
    width: '60px',
    height: '60px',
    border: '6px solid #fff',
    borderTop: '6px solid #00f2ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default Loading;