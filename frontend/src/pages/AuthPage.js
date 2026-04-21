import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPage.css';

const AuthPage = ({ defaultMode = 'login' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();
  const [mode, setMode]       = useState(defaultMode);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' });

  const returnTo = searchParams.get('next') || '/';

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await login(form.email, form.password);
        toast.success(`Welcome back, ${user.name.split(' ')[0]}! 🍰`);
        navigate(returnTo, { replace: true });
      } else {
        // Validate phone
        if (!form.phone) { toast.error('Phone number is required'); setLoading(false); return; }
        if (!/^[6-9]\d{9}$/.test(form.phone)) { toast.error('Enter a valid 10-digit Indian mobile number'); setLoading(false); return; }
        if (form.password.length < 8)  { toast.error('Password must be at least 8 characters'); setLoading(false); return; }
        if (!/\d/.test(form.password)) { toast.error('Password must contain at least one number'); setLoading(false); return; }

        const user = await register(form.name, form.email, form.password, form.phone);
        toast.success(`Welcome to SweetCrumbs, ${user.name.split(' ')[0]}! 🎂`);
        navigate(returnTo, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand" onClick={() => navigate('/')}>🍰 SweetCrumbs</div>
        <div className="auth-left-content">
          <span className="auth-emoji">🎂</span>
          <h2>Baked with Love</h2>
          <p>Join thousands of happy customers enjoying our handcrafted chocolatey delights!</p>
          <div className="auth-features">
            {[
              'Track your orders in real-time',
              'Get exclusive member discounts',
              'Save delivery addresses',
              'Custom cake requests',
            ].map(f => (
              <div key={f} className="auth-feature-item"><span>✓</span><span>{f}</span></div>
            ))}
          </div>
          {returnTo !== '/' && (
            <div className="auth-return-hint">
              🔒 You need to be logged in to continue
            </div>
          )}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-toggle">
            <button className={mode==='login'?'active':''} onClick={() => setMode('login')}>Login</button>
            <button className={mode==='register'?'active':''} onClick={() => setMode('register')}>Register</button>
          </div>

          <h2 className="auth-title">{mode==='login' ? 'Welcome Back!' : 'Create Account'}</h2>
          <p className="auth-sub">{mode==='login' ? 'Sign in to your SweetCrumbs account' : 'Start your sweet journey with us'}</p>

          <form onSubmit={handleSubmit} noValidate>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-control"
                  placeholder="Priya Mehta"
                  value={form.name}
                  onChange={set('name')}
                  required
                  maxLength={60}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                className="form-control"
                type="email"
                placeholder="priya@email.com"
                value={form.email}
                onChange={set('email')}
                required
                autoComplete="email"
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">
                  WhatsApp / Mobile Number *
                  <span className="field-hint"> (10-digit Indian number)</span>
                </label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">+91</span>
                  <input
                    className="form-control phone-input"
                    type="tel"
                    placeholder="98765 43210"
                    value={form.phone}
                    onChange={e => set('phone')({ target: { value: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                    required
                    maxLength={10}
                    autoComplete="tel"
                  />
                </div>
                <p className="field-note">📱 We'll send order updates on this number</p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="pass-wrap">
                <input
                  className="form-control pass-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min 8 chars, include a number' : 'Your password'}
                  value={form.password}
                  onChange={set('password')}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {mode === 'register' && form.password && (
              <div className="pass-strength">
                <div className={`strength-bar ${form.password.length >= 8 && /\d/.test(form.password) ? 'strong' : form.password.length >= 6 ? 'medium' : 'weak'}`} />
                <span className="strength-label">
                  {form.password.length >= 8 && /\d/.test(form.password) ? '✅ Strong password' : form.password.length >= 6 ? '⚠️ Add a number' : '❌ Too short'}
                </span>
              </div>
            )}

            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading
                ? (mode==='login' ? 'Signing in…' : 'Creating account…')
                : (mode==='login' ? '🔑 Sign In' : '🎂 Create Account')}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <button className="btn-wa auth-wa"
            onClick={() => window.open(`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER}?text=Hi! I'd like to place an order.`, '_blank')}>
            📱 Order directly via WhatsApp
          </button>

          <p className="auth-switch">
            {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setMode(mode==='login'?'register':'login')} className="auth-switch-btn">
              {mode==='login' ? 'Register free' : 'Sign in'}
            </button>
          </p>

          {mode === 'login' && (
            <p style={{ textAlign:'center', fontSize:12, color:'var(--brown-light)', marginTop:12 }}>
              Forgot password?{' '}
              <a href={`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER}?text=Hi, I forgot my SweetCrumbs password. Please help!`}
                 target="_blank" rel="noreferrer" style={{ color:'var(--green)', fontWeight:600 }}>
                WhatsApp us
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
