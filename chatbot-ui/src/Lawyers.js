// src/Lawyers.js
import React from 'react';

/*
 * SECURITY/RELIABILITY FIX: previously hotlinked Freepik "premium" preview
 * images directly (unclear licensing for production hotlinking, and the
 * URLs can change or 404 at any time). Replaced with initials avatars
 * generated client-side below -- no external image dependency at all.
 */
const dummyLawyers = [
  {
    name: 'Rabia Hafeez',
    field: 'Family Law',
    whatsapp: 'https://wa.me/923098609451'
  },
  {
    name: 'Muhammad Shahid Iqbal',
    field: 'Criminal Law',
    whatsapp: 'https://wa.me/923026727015'
  },
  {
    name: 'Muhammad Zeeshan',
    field: 'Corporate Law',
    whatsapp: 'https://wa.me/923000513123'
  }
];

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

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
                <div className="lawyer-avatar-initials" aria-hidden="true">
                  {getInitials(lawyer.name)}
                </div>
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
