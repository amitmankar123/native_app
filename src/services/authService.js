import { apiRequest } from './apiClient';
import { secureStorage } from './secureStorage';

export const authService = {
  async register({ name, email, password, mobile }) {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, mobile }),
    });

    if (res.data) {
      await secureStorage.setSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
        preferences: res.data.preferences,
      });
    }

    return res.data;
  },

  async login({ email, password }) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.data) {
      await secureStorage.setSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
        preferences: res.data.preferences,
      });
    }

    return res.data;
  },

  async logout() {
    try {
      const refreshToken = secureStorage.getRefreshToken();
      if (refreshToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (e) {
      // Continue cleanup even if network request fails
    } finally {
      await secureStorage.clearSession();
    }
  },

  async getMe() {
    const res = await apiRequest('/auth/me', { method: 'GET' });
    if (res.data?.user) {
      await secureStorage.setSession({
        user: res.data.user,
        preferences: res.data.preferences,
      });
    }
    return res.data;
  },

  async updateProfile(profileData) {
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    if (res.data) {
      await secureStorage.setSession({ user: res.data });
    }
    return res.data;
  },

  async getPreferences() {
    const res = await apiRequest('/auth/preferences', { method: 'GET' });
    return res.data;
  },

  async updatePreferences(preferencesData) {
    const res = await apiRequest('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferencesData),
    });
    if (res.data) {
      await secureStorage.setSession({ preferences: res.data });
    }
    return res.data;
  },

  async forgotPassword(email) {
    return await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword({ token, newPassword }) {
    return await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async getSessions() {
    const res = await apiRequest('/auth/sessions', { method: 'GET' });
    return res.data;
  },

  async revokeSession(sessionId) {
    return await apiRequest(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  },

  async logoutAll() {
    const res = await apiRequest('/auth/logout-all', { method: 'POST' });
    await secureStorage.clearSession();
    return res;
  },
};

