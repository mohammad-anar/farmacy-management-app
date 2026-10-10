import { create } from 'zustand';
import { User } from '../types';
import { storage } from '../utils/storage';
import { authApi } from '../api/auth.api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  initAuth: async () => {
    try {
      const token = await storage.getAccessToken();
      const storedUser = await storage.getUser();

      if (token && storedUser) {
        set({ user: storedUser, isAuthenticated: true, isLoading: false });
        // Silently revalidate user profile in background
        try {
          const freshUser = await authApi.getMe();
          await storage.setUser(freshUser);
          set({ user: freshUser });
        } catch {
          // Token might have expired, interceptor will try refresh
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email: string, pass: string) => {
    const res = await authApi.login(email, pass);
    await storage.setAccessToken(res.accessToken);
    await storage.setRefreshToken(res.refreshToken);
    await storage.setUser(res.user);
    set({ user: res.user, isAuthenticated: true });
  },

  logout: async () => {
    const refreshToken = await storage.getRefreshToken();
    await authApi.logout(refreshToken || undefined);
    await storage.clearAuth();
    set({ user: null, isAuthenticated: false });
  },
}));
