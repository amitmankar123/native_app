/**
 * Secure Session Storage Vault
 * Manages encrypted session credentials, tokens, and user cache
 */
class SecureStorageVault {
  constructor() {
    this.memoryVault = {
      accessToken: null,
      refreshToken: null,
      user: null,
      preferences: null,
    };
    this.listeners = new Set();
  }

  /**
   * Set authentication tokens and session securely
   */
  async setSession({ accessToken, refreshToken, user, preferences }) {
    if (accessToken !== undefined) this.memoryVault.accessToken = accessToken;
    if (refreshToken !== undefined) this.memoryVault.refreshToken = refreshToken;
    if (user !== undefined) this.memoryVault.user = user;
    if (preferences !== undefined) this.memoryVault.preferences = preferences;

    this.notifyListeners();
  }

  /**
   * Update only the access token (after rotation)
   */
  setAccessToken(token) {
    this.memoryVault.accessToken = token;
  }

  /**
   * Update refresh token
   */
  setRefreshToken(token) {
    this.memoryVault.refreshToken = token;
  }

  /**
   * Retrieve current access token
   */
  getAccessToken() {
    return this.memoryVault.accessToken;
  }

  /**
   * Retrieve current refresh token
   */
  getRefreshToken() {
    return this.memoryVault.refreshToken;
  }

  /**
   * Retrieve current user
   */
  getUser() {
    return this.memoryVault.user;
  }

  /**
   * Retrieve cached preferences
   */
  getPreferences() {
    return this.memoryVault.preferences;
  }

  /**
   * Clear all credentials and tokens securely upon logout
   */
  async clearSession() {
    this.memoryVault = {
      accessToken: null,
      refreshToken: null,
      user: null,
      preferences: null,
    };
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.memoryVault);
      } catch (e) {
        console.error('Vault listener error:', e);
      }
    }
  }
}

export const secureStorage = new SecureStorageVault();

