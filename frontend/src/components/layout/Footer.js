import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { settingsAPI } from '../../services/api';
import './Footer.css';

const Footer = () => {
  const [s, setS] = useState(null);
  useEffect(() => { settingsAPI.get().then(r => setS(r.data.settings)).catch(() => {}); }, []);

  const brand  = s?.brandName     || 'Kirtivyaa';
  const wa     = s?.whatsappNumber || process.env.REACT_APP_WHATSAPP_NUMBER;
  const phone  = wa?.replace(/^91/, '') || '7350554539';
  const city   = s?.city          || 'Pune';
  const email  = s?.email         || 'agarwalkirtim20@gmail.com';
  const addr   = s?.address       || 'Khese Park, Lohegaon Pune, Maharashtra';
  const hours  = s?.openingHours  || 'Mon–Sun: 8 AM – 8 PM';

  return (
    <footer className="footer">
      <div className="footer-inner container">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <div className="footer-logo">🍰 {brand}</div>
            <p>A home bakery born from passion. Every cake is handcrafted with premium Belgian chocolate, baked fresh daily, and delivered with love across {city}.</p>
            <div className="footer-socials">
              {s?.instagramUrl && <a href={s.instagramUrl} target="_blank" rel="noreferrer">📷 Instagram</a>}
              {s?.facebookUrl  && <a href={s.facebookUrl}  target="_blank" rel="noreferrer">📘 Facebook</a>}
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
            </div>
          </div>
          <div>
            <h4>Navigate</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/track">Track Order</Link></li>
              <li><Link to="/about">About Kirti</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Our Products</h4>
            <ul>
              <li><Link to="/products?category=Cakes">Chocolate Cakes</Link></li>
              <li><Link to="/products?category=Cupcakes">Cupcakes</Link></li>
              <li><Link to="/products?category=Brownies">Brownies</Link></li>
              <li><Link to="/products?category=Hampers">Gift Hampers</Link></li>
              <li><Link to="/products">Custom Cakes</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact Us</h4>
            <ul className="contact-list">
              <li>📱 +91 {phone}</li>
              <li>📧 {email}</li>
              <li>📍 {addr}</li>
              <li>⏰ {hours}</li>
              {s?.fssaiNumber && <li>🏷️ FSSAI: {s.fssaiNumber}</li>}
            </ul>
            <button className="wa-footer-btn"
              onClick={() => window.open(`https://wa.me/${wa}`, '_blank')}>
              💬 WhatsApp Us
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} {brand} by {s?.ownerName || 'Kirti Agarwal'}. Made with 🍫 in {city}.</span>
          <span>FSSAI Certified · All rights reserved</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
