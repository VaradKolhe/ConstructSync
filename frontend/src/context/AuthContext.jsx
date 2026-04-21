import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data.data;
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  const verifyOTP = async (otp, newEmail) => {
    try {
      await api.post('/auth/verify-email', { otp, newEmail });
      setUser(prev => ({ ...prev, isEmailVerified: true }));
    } catch (err) {
      const message = err.response?.data?.message || 'Verification failed';
      throw new Error(message);
    }
  };

  const completeOnboarding = async (newPassword) => {
    try {
      await api.post('/auth/complete-onboarding', { newPassword });
      setUser(prev => ({ ...prev, isFirstLogin: false }));
    } catch (err) {
      const message = err.response?.data?.message || 'Onboarding failed';
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      logout, 
      verifyOTP, 
      completeOnboarding,
      isAuthenticated: !!user && !user.isFirstLogin && user.isEmailVerified,
      isPendingOnboarding: !!user && (user.isFirstLogin || !user.isEmailVerified)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
