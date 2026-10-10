import { apiClient } from './client';
import { AuthResponse, User } from '../types';

export const authApi = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res: any = await apiClient.post('/auth/login', { email, password });
    return res.data || res;
  },

  async getMe(): Promise<User> {
    const res: any = await apiClient.get('/auth/me');
    return res.data || res;
  },

  async logout(refreshToken?: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore network errors on logout
    }
  },
};
