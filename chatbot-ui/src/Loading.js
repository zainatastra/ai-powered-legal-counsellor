// src/Loading.js
import React from 'react';

const Loading = () => {
  return (
    <div style={styles.loaderWrapper} aria-label="Loading">
      <div className="loading-content" style={styles.content}>
        <div style={styles.brandRow}>
          <div style={styles.logoSkeleton}></div>
          <div style={styles.brandSkeleton}>
            <div style={styles.brandLine}></div>
            <div style={styles.brandSubLine}></div>
          </div>
        </div>

        <div style={styles.heroSkeleton}>
          <div style={styles.heroTitle}></div>
          <div style={styles.heroText}></div>
          <div style={styles.heroTextShort}></div>
        </div>

        <div className="loading-cards" style={styles.cards}>
          <div className="loading-card" style={styles.card}>
            <div style={styles.cardImage}></div>
            <div style={styles.cardLine}></div>
            <div style={styles.cardLineShort}></div>
            <div style={styles.cardButton}></div>
          </div>
          <div className="loading-card" style={styles.card}>
            <div style={styles.cardImage}></div>
            <div style={styles.cardLine}></div>
            <div style={styles.cardLineShort}></div>
            <div style={styles.cardButton}></div>
          </div>
          <div className="loading-card" style={styles.card}>
            <div style={styles.cardImage}></div>
            <div style={styles.cardLine}></div>
            <div style={styles.cardLineShort}></div>
            <div style={styles.cardButton}></div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes skeletonShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .skeleton {
          background: linear-gradient(
            90deg,
            #eeeae2 25%,
            #f8f6f1 50%,
            #eeeae2 75%
          );
          background-size: 200% 100%;
          animation: skeletonShimmer 1.5s ease-in-out infinite;
        }

        @media (max-width: 760px) {
          .loading-content {
            padding: 24px !important;
          }

          .loading-cards {
            grid-template-columns: 1fr !important;
          }

          .loading-card:nth-child(n+2) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

const skeletonBase = {
  background: 'linear-gradient(90deg, #eeeae2 25%, #f8f6f1 50%, #eeeae2 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeletonShimmer 1.5s ease-in-out infinite'
};

const styles = {
  loaderWrapper: {
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FCFBF8',
    fontFamily: "'Saira', 'Segoe UI', sans-serif",
    overflow: 'hidden',
    position: 'relative'
  },

  content: {
    width: '100%',
    maxWidth: '1080px',
    padding: '42px 30px',
    boxSizing: 'border-box'
  },

  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '72px'
  },

  logoSkeleton: {
    ...skeletonBase,
    width: '42px',
    height: '42px',
    borderRadius: '12px'
  },

  brandSkeleton: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },

  brandLine: {
    ...skeletonBase,
    width: '145px',
    height: '13px',
    borderRadius: '6px'
  },

  brandSubLine: {
    ...skeletonBase,
    width: '95px',
    height: '8px',
    borderRadius: '5px'
  },

  heroSkeleton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '55px'
  },

  heroTitle: {
    ...skeletonBase,
    width: 'min(520px, 75%)',
    height: '34px',
    borderRadius: '9px',
    marginBottom: '17px'
  },

  heroText: {
    ...skeletonBase,
    width: 'min(440px, 68%)',
    height: '11px',
    borderRadius: '6px',
    marginBottom: '9px'
  },

  heroTextShort: {
    ...skeletonBase,
    width: 'min(320px, 52%)',
    height: '11px',
    borderRadius: '6px'
  },

  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '22px'
  },

  card: {
    background: '#FFFFFF',
    border: '1px solid #E6E0D5',
    borderRadius: '20px',
    padding: '27px 24px 24px',
    boxSizing: 'border-box',
    boxShadow: '0 10px 30px rgba(11, 23, 42, 0.05)'
  },

  cardImage: {
    ...skeletonBase,
    width: '94px',
    height: '94px',
    borderRadius: '50%',
    margin: '0 auto 22px'
  },

  cardLine: {
    ...skeletonBase,
    width: '72%',
    height: '14px',
    borderRadius: '6px',
    margin: '0 auto 10px'
  },

  cardLineShort: {
    ...skeletonBase,
    width: '42%',
    height: '9px',
    borderRadius: '5px',
    margin: '0 auto 24px'
  },

  cardButton: {
    ...skeletonBase,
    width: '100%',
    height: '42px',
    borderRadius: '10px'
  }
};

export default Loading;
