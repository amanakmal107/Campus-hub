import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        api.clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password, rememberMe = true) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      api.setTokens(data.accessToken, data.refreshToken);
      if (!rememberMe) {
        sessionStorage.setItem('campushub_session_only', 'true');
      }
      setUser(data.user);
      showToast(`Welcome back, ${data.user.name}!`, 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      return {
        success: false,
        error: err.message,
        needsVerification: err.data?.needsVerification,
        email: err.data?.email,
        previewOtp: err.data?.previewOtp,
      };
    }
  };

  const register = async (userData) => {
    try {
      const data = await api.post('/auth/register', userData);
      showToast('Verification OTP sent to your college email!', 'success');
      return {
        success: true,
        needsVerification: data.needsVerification,
        email: data.email,
        previewOtp: data.previewOtp,
      };
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      return { success: false, error: err.message };
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const data = await api.post('/auth/verify-otp', { email, otp });
      api.setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      showToast('Email verified successfully! Welcome to CampusHub!', 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
      return { success: false, error: err.message };
    }
  };

  const resendOtp = async (email) => {
    try {
      const data = await api.post('/auth/resend-otp', { email });
      showToast('Fresh OTP sent to your email!', 'info');
      return { success: true, previewOtp: data.previewOtp };
    } catch (err) {
      showToast(err.message || 'Failed to resend OTP', 'error');
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      api.clearTokens();
      setUser(null);
      showToast('Logged out safely', 'info');
    }
  };

  const updateProfile = async (formData) => {
    try {
      const data = await api.put(`/users/${user.id}`, formData);
      setUser((prev) => ({ ...prev, ...data.user }));
      showToast('Profile updated successfully!', 'success');
      return { success: true, user: data.user };
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
      return { success: false, error: err.message };
    }
  };

  const updateAvatar = async (file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const data = await api.post(`/users/${user.id}/avatar`, formData);
      setUser((prev) => ({ ...prev, avatar_url: data.user.avatar_url }));
      showToast('Avatar updated successfully!', 'success');
      return { success: true, avatar_url: data.user.avatar_url };
    } catch (err) {
      showToast(err.message || 'Failed to upload avatar', 'error');
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
