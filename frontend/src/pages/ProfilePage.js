import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name:    user?.name    || '',
    phone:   user?.phone   || '',
    street:  user?.address?.street  || '',
    city:    user?.address?.city    || 'Nagpur',
    pincode: user?.address?.pincode || '',
  });

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPass, setShowPass]   = useState({ current: false, new: false });

  const setP  = k => e => setProfile(f => ({ ...f, [k]: e.target.value }));
  const setPw = k => e => setPasswords(f => ({ ...f, [k]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    if (profile.phone && !/^[6-9]\d{9}$/.test(profile.phone)) {
      toast.error('Enter a valid 10-digit Indian mobile number'); return;
    }
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile({
        name:  profile.name,
        phone: profile.phone,
        address: { street: profile.street, city: profile.city, pincode: profile.pincode },
      });
      updateUser(data.user);
      toast.success('Profile updated! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPass.length < 8)          { toast.error('New password must be at least 8 characters'); return; }
    if (!/\d/.test(passwords.newPass))          { toast.error('New password must contain at least one number'); return; }
    if (passwords.newPass !== passwords.confirm){ toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: passwords.current, newPassword: passwords.newPass });
      toast.success('Password changed! 🔒');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="profile-page" style={{ paddingTop: 68 }}>
      <div className="profile-hero">
        <div className="container">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div>
              <h1 className="profile-name">{user?.name}</h1>
              <p className="profile-email">{user?.email}</p>
              {user?.role === 'admin' && <span className="admin-badge">👑 Admin</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="container profile-layout">
        {/* Tabs */}
        <div className="profile-tabs">
          {[
            { id: 'profile',  label: '👤 Profile' },
            { id: 'security', label: '🔒 Security' },
          ].map(t => (
            <button key={t.id} className={`profile-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="profile-content">
          {tab === 'profile' && (
            <form onSubmit={saveProfile}>
              <div className="form-card">
                <h3>Personal Information</h3>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" value={profile.name} onChange={setP('name')} required maxLength={60} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-control" value={user?.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                  <p className="field-note">Email cannot be changed. Contact us on WhatsApp if needed.</p>
                </div>
                <div className="form-group">
                  <label className="form-label">WhatsApp / Mobile Number *</label>
                  <div className="phone-input-wrap">
                    <span className="phone-prefix">+91</span>
                    <input
                      className="form-control phone-input"
                      type="tel"
                      placeholder="98765 43210"
                      value={profile.phone}
                      onChange={e => setP('phone')({ target: { value: e.target.value.replace(/\D/g,'').slice(0,10) } })}
                      maxLength={10}
                    />
                  </div>
                  <p className="field-note">📱 Used for order confirmations on WhatsApp</p>
                </div>
              </div>

              <div className="form-card">
                <h3>Default Delivery Address</h3>
                <p className="section-note">This will be pre-filled at checkout to save you time.</p>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input className="form-control" placeholder="Flat No, Building, Street, Area" value={profile.street} onChange={setP('street')} maxLength={200} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-control" value={profile.city} onChange={setP('city')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PIN Code</label>
                    <input className="form-control" placeholder="440001" value={profile.pincode}
                      onChange={e => setP('pincode')({ target: { value: e.target.value.replace(/\D/g,'').slice(0,6) } })}
                      maxLength={6} />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={changePassword}>
              <div className="form-card">
                <h3>Change Password</h3>
                <p className="section-note">Use a strong password with at least 8 characters and one number.</p>
                {[
                  { key: 'current', label: 'Current Password', show: showPass.current, toggle: () => setShowPass(v => ({ ...v, current: !v.current })) },
                  { key: 'newPass', label: 'New Password',     show: showPass.new,     toggle: () => setShowPass(v => ({ ...v, new: !v.new })) },
                  { key: 'confirm', label: 'Confirm New Password', show: showPass.new,  toggle: () => setShowPass(v => ({ ...v, new: !v.new })) },
                ].map(f => (
                  <div className="form-group" key={f.key}>
                    <label className="form-label">{f.label}</label>
                    <div className="pass-wrap">
                      <input
                        className="form-control pass-input"
                        type={f.show ? 'text' : 'password'}
                        value={passwords[f.key]}
                        onChange={setPw(f.key)}
                        required
                      />
                      <button type="button" className="pass-toggle" onClick={f.toggle}>
                        {f.show ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                ))}
                {passwords.newPass && (
                  <div className="pass-strength">
                    <div className={`strength-bar ${passwords.newPass.length >= 8 && /\d/.test(passwords.newPass) ? 'strong' : passwords.newPass.length >= 6 ? 'medium' : 'weak'}`} />
                    <span className="strength-label">
                      {passwords.newPass.length >= 8 && /\d/.test(passwords.newPass) ? '✅ Strong' : passwords.newPass.length >= 6 ? '⚠️ Add a number' : '❌ Too short'}
                    </span>
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Updating…' : '🔒 Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
