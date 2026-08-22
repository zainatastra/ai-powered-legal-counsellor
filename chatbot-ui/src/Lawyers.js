// src/Lawyers.js
import React from 'react';

const dummyLawyers = [
  {
    name: 'Rabia Hafeez',
    field: 'Family Law',
    image: 'https://img.freepik.com/premium-photo/female-lawyer-flat-design-cartoon-image_776894-120024.jpg',
    whatsapp: 'https://wa.me/923098609451'
  },
  {
    name: 'Muhammad Shahid Iqbal',
    field: 'Criminal Law',
    image: 'https://img.freepik.com/premium-psd/d1-full-body-image-candidate-with-hopeful-stance-icon-imag-isolated-iconic-abstract-designs_1020495-774854.jpg?semt=ais_hybrid&w=740',
    whatsapp: 'https://wa.me/923026727015'
  },
  {
    name: 'Muhammad Zeeshan',
    field: 'Corporate Law',
    image: 'https://img.freepik.com/premium-psd/d1-full-body-image-candidate-with-hopeful-stance-icon-imag-isolated-iconic-abstract-designs_1020495-774854.jpg?semt=ais_hybrid&w=740',
    whatsapp: 'https://wa.me/923000513123'
  }
];

const Lawyers = () => {
  return (
    <div style={styles.container}>
      <div style={styles.backgroundGlow}></div>

      <div className="lawyer-page-content" style={styles.content}>
        <header style={styles.header}>
          <div style={styles.eyebrow}>LEGAL PROFESSIONALS</div>
          <h1 style={styles.title}>Connect with a qualified lawyer</h1>
          <p style={styles.subtitle}>
            Find professional legal assistance for your specific area of law.
          </p>
        </header>

        <div className="lawyer-card-grid" style={styles.cardWrapper}>
          {dummyLawyers.map((lawyer, index) => (
            <div key={index} className="lawyer-card" style={styles.card}>
              <div style={styles.cardTop}>
                <span style={styles.practiceLabel}>{lawyer.field}</span>
              </div>

              <div style={styles.imageFrame}>
                <img
                  src={lawyer.image}
                  alt={lawyer.name}
                  style={styles.image}
                />
              </div>

              <div style={styles.cardBody}>
                <h3 style={styles.name}>{lawyer.name}</h3>
                <p style={styles.field}>{lawyer.field}</p>

                <a
                  href={lawyer.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.button}
                >
                  <span style={styles.buttonIcon}>↗</span>
                  <span>Connect on WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        <p style={styles.disclaimer}>
          AI assistance does not replace advice from a qualified legal professional.
        </p>
      </div>

      <style>{`
        .lawyer-card {
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        }

        .lawyer-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 55px rgba(11, 23, 42, 0.14);
          border-color: rgba(184, 146, 74, 0.42);
        }

        .lawyer-connect:hover {
          background: #12233D;
          color: #FFFFFF;
          border-color: #12233D;
          box-shadow: 0 10px 24px rgba(11, 23, 42, 0.18);
        }

        @media (max-width: 760px) {
          .lawyer-page-content {
            padding: 42px 18px 30px !important;
          }

          .lawyer-page-title {
            font-size: 32px !important;
          }

          .lawyer-card-grid {
            grid-template-columns: 1fr !important;
            max-width: 430px !important;
          }
        }
      `}</style>
    </div>
  );
};

const colors = {
  navy: '#0B172A',
  navyLight: '#12233D',
  gold: '#B8924A',
  goldLight: '#D0AE6B',
  paper: '#FCFBF8',
  border: '#E6E0D5',
  text: '#172033',
  muted: '#747B86',
  white: '#FFFFFF'
};

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    fontFamily: "'Saira', 'Segoe UI', sans-serif",
    background: colors.paper,
    color: colors.text,
    padding: 0
  },

  backgroundGlow: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(circle at 50% 0%, rgba(184,146,74,0.10), transparent 34%), linear-gradient(180deg, #FCFBF8 0%, #F7F5F0 100%)'
  },

  content: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '62px 30px 34px',
    boxSizing: 'border-box'
  },

  header: {
    textAlign: 'center',
    maxWidth: '700px',
    margin: '0 auto 42px'
  },

  eyebrow: {
    fontFamily: "'Jost', sans-serif",
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '2.2px',
    color: colors.gold,
    marginBottom: '12px'
  },

  title: {
    margin: 0,
    fontFamily: "'Jost', sans-serif",
    fontSize: 'clamp(30px, 4vw, 44px)',
    lineHeight: 1.1,
    letterSpacing: '-1.3px',
    fontWeight: '700',
    color: colors.navy
  },

  subtitle: {
    maxWidth: '560px',
    margin: '15px auto 0',
    fontSize: '14px',
    lineHeight: 1.7,
    color: colors.muted
  },

  cardWrapper: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '22px',
    width: '100%',
    maxWidth: '1080px',
    margin: '0 auto'
  },

  card: {
    minWidth: 0,
    background: 'rgba(255,255,255,0.92)',
    border: `1px solid ${colors.border}`,
    borderRadius: '20px',
    overflow: 'hidden',
    textAlign: 'center',
    boxShadow: '0 12px 35px rgba(11, 23, 42, 0.065)',
    transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease'
  },

  cardTop: {
    height: '38px',
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    background: '#FFFFFF',
    borderBottom: `1px solid ${colors.border}`
  },

  practiceLabel: {
    padding: '5px 9px',
    borderRadius: '20px',
    background: '#F4EFE5',
    color: '#80652F',
    fontFamily: "'Jost', sans-serif",
    fontSize: '9px',
    fontWeight: '700',
    letterSpacing: '0.6px',
    textTransform: 'uppercase'
  },

  imageFrame: {
    width: '112px',
    height: '112px',
    margin: '28px auto 17px',
    padding: '4px',
    boxSizing: 'border-box',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.goldLight}, ${colors.gold})`,
    boxShadow: '0 9px 25px rgba(184,146,74,0.16)'
  },

  image: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    display: 'block',
    background: '#F1F0EC',
    border: '3px solid #FFFFFF'
  },

  cardBody: {
    padding: '0 24px 25px'
  },

  name: {
    margin: '0',
    fontFamily: "'Jost', sans-serif",
    fontSize: '18px',
    lineHeight: 1.35,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: '-0.25px'
  },

  field: {
    margin: '6px 0 21px',
    color: colors.muted,
    fontSize: '13px',
    lineHeight: 1.5
  },

  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    minHeight: '44px',
    boxSizing: 'border-box',
    padding: '10px 15px',
    background: colors.navy,
    color: colors.white,
    border: `1px solid ${colors.navy}`,
    borderRadius: '10px',
    textDecoration: 'none',
    fontFamily: "'Jost', sans-serif",
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 220ms ease'
  },

  buttonIcon: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.12)',
    fontSize: '12px'
  },

  disclaimer: {
    margin: '25px auto 0',
    textAlign: 'center',
    color: '#9A9B9A',
    fontSize: '9px',
    lineHeight: 1.5
  }
};

export default Lawyers;
