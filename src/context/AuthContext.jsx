import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { secureStorage } from '../services/secureStorage';
import { setSessionExpiredHandler } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize session expired callback
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setPreferences(null);
    });
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const accessToken = secureStorage.getAccessToken();
      const refreshToken = secureStorage.getRefreshToken();

      if (accessToken || refreshToken) {
        const data = await authService.getMe();
        if (data?.user) {
          setUser(data.user);
          setPreferences(data.preferences);
        }
      }
    } catch (err) {
      console.log('Session restore info:', err.message);
      // If restore fails, user remains unauthenticated
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authService.login({ email, password });
      setUser(data.user);
      setPreferences(data.preferences);
      return data;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async ({ name, email, password, mobile }) => {
    setError(null);
    try {
      const data = await authService.register({ name, email, password, mobile });
      setUser(data.user);
      setPreferences(data.preferences);
      return data;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setPreferences(null);
    }
  };

  const updateProfile = async (profileData) => {
    const updated = await authService.updateProfile(profileData);
    setUser(updated);
    return updated;
  };

  const updatePreferences = async (prefData) => {
    const updated = await authService.updatePreferences(prefData);
    setPreferences(updated);
    return updated;
  };

  const value = {
    user,
    preferences,
    isAuthenticated: Boolean(user),
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

