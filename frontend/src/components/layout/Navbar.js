import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { settingsAPI } from '../../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount }             = useCart();
  const navigate  = useNavigate();
  const location  = useLocation();
  const dropRef   = useRef(null);

  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);
  const [brandName, setBrandName] = useState('Kirtivyaa');
  const [waNum,     setWaNum]     = useState(process.env.REACT_APP_WHATSAPP_NUMBER);

  useEffect(() => {
    settingsAPI.get()
      .then(r => {
        setBrandName(r.data.settings?.brandName || 'Kirtivyaa');
        setWaNum(r.data.settings?.whatsappNumber || process.env.REACT_APP_WHATSAPP_NUMBER);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [location]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleCartClick = () => {
    navigate(user ? '/cart' : '/login?next=/cart');
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} role="navigation">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo" aria-label={`${brandName} Home`}>
          <div className="logo-icon">🍰</div>
          <span>{brandName}</span>
          <span className="veg-badge">🟢 Pure Veg</span>
        </Link>

        <div className="navbar-links">
          <Link to="/"         className={isActive('/')}>Home</Link>
          <Link to="/products" className={isActive('/products')}>Menu</Link>
          <Link to="/track"    className={isActive('/track')}>Track Order</Link>
          <Link to="/about"    className={isActive('/about')}>About</Link>
          <Link to="/contact"  className={isActive('/contact')}>Contact</Link>
          {isAdmin && <Link to="/admin" className="admin-link">⚡ Admin</Link>}
        </div>

        <div className="navbar-actions">
          <button className="icon-btn" onClick={() => navigate('/products')} title="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          <button className="icon-btn cart-btn" onClick={handleCartClick} title="Cart" aria-label={`Cart — ${itemCount} items`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {itemCount > 0 && <span className="cart-badge">{itemCount > 9 ? '9+' : itemCount}</span>}
          </button>

          {user ? (
            <div className="user-dropdown" ref={dropRef}>
              <button className="user-btn" onClick={() => setDropOpen(v => !v)} aria-expanded={dropOpen}>
                <div className="user-avatar">{user.name[0].toUpperCase()}</div>
                <span className="user-name">{user.name.split(' ')[0]}</span>
                <span className="drop-arrow">{dropOpen ? '▲' : '▼'}</span>
              </button>
              {dropOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-user-info">
                    <p className="dropdown-user-name">{user.name}</p>
                    <p className="dropdown-user-email">{user.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/profile">👤 My Profile</Link>
                  <Link to="/orders">📦 My Orders</Link>
                  <Link to="/track">🔍 Track Order</Link>
                  {isAdmin && <Link to="/admin" className="dropdown-admin">⚡ Admin Panel</Link>}
                  <div className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-logout">🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary nav-login-btn">Login</Link>
          )}

          <button className="wa-btn" onClick={() => window.open(`https://wa.me/${waNum}`, '_blank')}>
            📱 WhatsApp
          </button>

          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/">🏠 Home</Link>
          <Link to="/products">🎂 Menu</Link>
          <Link to="/track">📦 Track Order</Link>
          <Link to="/about">ℹ️ About Kirti</Link>
          <Link to="/contact">📞 Contact</Link>
          <div className="mobile-divider" />
          {user ? (
            <>
              <Link to="/profile">👤 My Profile</Link>
              <Link to="/orders">📦 My Orders</Link>
              {isAdmin && <Link to="/admin">⚡ Admin Panel</Link>}
              <button onClick={handleLogout} className="mobile-logout">🚪 Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-login">🔑 Login</Link>
              <Link to="/register">✨ Register Free</Link>
            </>
          )}
          <button className="mobile-wa-btn" onClick={() => window.open(`https://wa.me/${waNum}`, '_blank')}>
            📱 Order via WhatsApp
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
