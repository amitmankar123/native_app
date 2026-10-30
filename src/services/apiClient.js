import { BASE_URL } from '../env';
import { secureStorage } from './secureStorage';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let onSessionExpiredCallback = null;
export function setSessionExpiredHandler(callback) {
  onSessionExpiredCallback = callback;
}

/**
 * Base API Request with automatic token injection and 401 refresh retry
 */
export async function apiRequest(endpoint, options = {}, isRetry = false) {
  const url = `${BASE_URL}${endpoint}`;
  const accessToken = secureStorage.getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { message: 'Network response was not JSON' };
    }

    // Handle 401 Unauthorized -> Refresh Token Flow
    if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = secureStorage.getRefreshToken();
      if (!refreshToken) {
        if (onSessionExpiredCallback) onSessionExpiredCallback();
        throw new Error(data.message || 'Session expired. Please log in again.');
      }

      if (isRefreshing) {
        // Queue concurrent requests while single-flight refresh is in flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          };
          return apiRequest(endpoint, options, true);
        });
      }

      isRefreshing = true;

      try {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok || !refreshData.success) {
          throw new Error(refreshData.message || 'Session expired');
        }

        const newAccessToken = refreshData.data.accessToken;
        const newRefreshToken = refreshData.data.refreshToken;

        secureStorage.setAccessToken(newAccessToken);
        secureStorage.setRefreshToken(newRefreshToken);

        processQueue(null, newAccessToken);

        // Retry the original request
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        return apiRequest(endpoint, options, true);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await secureStorage.clearSession();
        if (onSessionExpiredCallback) onSessionExpiredCallback();
        throw new Error('Your session has expired. Please sign in again.');
      } finally {
        isRefreshing = false;
      }
    }

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.message === 'Network request failed') {
      const netErr = new Error(`Cannot reach server at ${BASE_URL}. Ensure backend is running.`);
      netErr.isNetworkError = true;
      throw netErr;
    }
    throw error;
  }
}

