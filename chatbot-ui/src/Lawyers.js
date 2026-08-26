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
    <div className="page-shell">
      <div className="ambient-glow" />

      <div className="page-content">
        <header className="page-header">
          <div className="page-eyebrow">LEGAL PROFESSIONALS</div>
          <h1 className="page-title">Connect with a qualified lawyer</h1>
          <p className="page-subtitle">
            Find professional legal assistance for your specific area of law.
          </p>
        </header>

        <div className="lawyer-grid">
          {dummyLawyers.map((lawyer, index) => (
            <div key={index} className="lawyer-card">
              <div className="lawyer-card-top">
                <span className="lawyer-badge">{lawyer.field}</span>
              </div>

              <div className="lawyer-avatar-frame">
                <img
                  src={lawyer.image}
                  alt={lawyer.name}
                  className="lawyer-avatar"
                  loading="lazy"
                />
              </div>

              <div className="lawyer-card-body">
                <h3 className="lawyer-name">{lawyer.name}</h3>
                <p className="lawyer-field">{lawyer.field}</p>

                <a
                  href={lawyer.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.16)',
                    fontSize: '12px',
                    flexShrink: 0
                  }}>
                    ↗
                  </span>
                  <span>Connect on WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="footnote" style={{ fontSize: 'var(--fs-xs)' }}>
          AI assistance does not replace advice from a qualified legal professional.
        </p>
      </div>
    </div>
  );
};

export default Lawyers;
