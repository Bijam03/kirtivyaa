import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async () => {
    const token = localStorage.getItem('sc_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      localStorage.setItem('sc_user', JSON.stringify(data.user));
    } catch {
      // Token invalid/expired — clear storage
      localStorage.removeItem('sc_token');
      localStorage.removeItem('sc_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { hydrateUser(); }, [hydrateUser]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('sc_token', data.token);
    localStorage.setItem('sc_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, phone) => {
    const { data } = await authAPI.register({ name, email, password, phone });
    localStorage.setItem('sc_token', data.token);
    localStorage.setItem('sc_user',  JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('sc_token');
    localStorage.removeItem('sc_user');
    setUser(null);
    toast.success('Logged out. See you soon! 👋');
  };

  const updateUser = (updated) => {
    setUser(updated);
    localStorage.setItem('sc_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
