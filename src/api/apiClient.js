import { BASE_URL } from '../env';

export { BASE_URL };

export const apiRequest = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint} (${url}):`, error.message);
    throw error;
  }
};
