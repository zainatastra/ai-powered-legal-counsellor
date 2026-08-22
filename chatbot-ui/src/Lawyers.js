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
      <div style={styles.overlay}></div>
      <div style={styles.cardWrapper}>
        {dummyLawyers.map((lawyer, index) => (
          <div key={index} style={styles.card}>
            <img src={lawyer.image} alt={lawyer.name} style={styles.image} />
            <h3 style={styles.name}>{lawyer.name}</h3>
            <p style={styles.field}>{lawyer.field}</p>
            <a
              href={lawyer.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.button}
            >
              Connect on WhatsApp
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: 'Saira',
    backgroundImage: `url(${process.env.PUBLIC_URL}/background.png)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 0
  },
  cardWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '25px',
    zIndex: 1,
    width: '100%',
    maxWidth: '1200px'
  },
  card: {
    width: '260px',
    backgroundColor: '#0f0f0f',
    borderRadius: '20px',
    padding: '25px',
    fontFamily: 'Saira',
    textAlign: 'center',
    boxShadow: '0 0 20px #00f2ff',
    zIndex: 1,
    transition: 'transform 0.3s ease',
    flex: '1 1 250px'
  },
  image: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    border: '2px solid #00f2ff',
    marginBottom: '10px',
    objectFit: 'cover'
  },
  name: {
    fontSize: '18px',
    color: '#fff',
    margin: '10px 0 5px'
  },
  field: {
    color: '#ccc',
    marginBottom: '15px',
    fontSize: '15px'
  },
  button: {
    display: 'inline-block',
    padding: '10px 18px',
    backgroundColor: '#00f2ff',
    color: '#000',
    fontFamily: 'Jost',
    fontWeight: 'bold',
    borderRadius: '30px',
    textDecoration: 'none',
    transition: '0.3s ease',
    boxShadow: '0 0 10px #00f2ff'
  }
};

export default Lawyers;
