import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { clearSession, getAuthToken } from '../utils/auth';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

const apiClient = axios.create({
  baseURL: configuredBaseUrl || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    config.headers['X-Request-Id'] = uuidv4();

    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        clearSession();
        window.location.href = '/login';
      }
      return Promise.reject(error.response.data);
    }

    return Promise.reject({
      success: false,
      code: 'NETWORK_ERROR',
      message: 'Network connection failed or timeout.',
    });
  },
);

export default apiClient;
