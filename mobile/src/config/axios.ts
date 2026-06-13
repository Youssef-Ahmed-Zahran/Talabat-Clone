import axios from 'axios';
import { useAuthStore } from '@src/store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach token from Zustand auth store (persisted via AsyncStorage)
api.interceptors.request.use(
  (config) => {
    try {
      // Read directly from the Zustand store — always in sync after rehydration
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Silently fail if store is unavailable
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 by triggering a proper logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Use the store's logout action so Zustand clears + AsyncStorage is updated
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
