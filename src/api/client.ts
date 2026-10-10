import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from '../utils/storage';

/**
 * Resolves the API Base URL with prioritized fallbacks:
 * 1. process.env.EXPO_PUBLIC_API_URL (from .env or Expo environment)
 * 2. Constants.expoConfig?.extra?.apiUrl
 * 3. Platform default: 10.0.2.2 for Android Emulator, localhost for iOS/Web
 */
export const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl) {
    return extraUrl;
  }

  // Fallback to live Render backend
  return 'https://farmacy-management-backend.onrender.com/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Bearer JWT
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Seamless Token Refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // Unpack uniform response payload { success: true, data: ... }
    if (response.data && response.data.data !== undefined) {
      return response.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('Session expired. Please log in again.');
        }

        const refreshRes = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken =
          refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        const newRefreshToken =
          refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;

        if (newAccessToken) {
          await storage.setAccessToken(newAccessToken);
          if (newRefreshToken) {
            await storage.setRefreshToken(newRefreshToken);
          }

          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await storage.clearAuth();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
