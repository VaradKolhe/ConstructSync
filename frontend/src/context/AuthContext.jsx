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
      const userData = response.data.data;
      setUser(userData ? { ...userData, id: userData._id } : null);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe });
      const userData = response.data.data;
      const userWithId = { ...userData, id: userData._id };
      setUser(userWithId);
      return userWithId;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      throw err; // Throw the original error object so LoginPage can access status codes if needed
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  const requestOTP = async (newEmail) => {
    try {
      const response = await api.post('/auth/request-otp', { newEmail });
      return response.data.message;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send OTP';
      throw new Error(message);
    }
  };

  const verifyOTP = async (otp, newEmail) => {
    try {
      await api.post('/auth/verify-email', { otp, newEmail });
      setUser(prev => ({ ...prev, isEmailVerified: true, email: newEmail || prev.email }));
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

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data.message;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to dispatch recovery email';
      throw new Error(message);
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await api.put(`/auth/reset-password/${token}`, { password });
      return response.data.message;
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed';
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser,
      loading, 
      error, 
      login, 
      logout, 
      requestOTP,
      verifyOTP, 
      completeOnboarding,
      forgotPassword,
      resetPassword,
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
  return {
    ...context,
    refreshProfile: context.checkAuth
  };
};
