import { apiClient } from './client';
import { Medicine, PaginatedResult } from '../types';

export interface MedicineFilters {
  search?: string;
  category?: string;
  dosageForm?: string;
  isLowStock?: boolean;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const medicinesApi = {
  async getAll(filters?: MedicineFilters): Promise<PaginatedResult<Medicine>> {
    const res: any = await apiClient.get('/medicines', { params: filters });
    return res.data || res;
  },

  async search(q: string, page = 1, limit = 20): Promise<PaginatedResult<Medicine>> {
    const res: any = await apiClient.get('/medicines/search', {
      params: { q, page, limit },
    });
    return res.data || res;
  },

  async getById(id: string): Promise<Medicine> {
    const res: any = await apiClient.get(`/medicines/${id}`);
    return res.data || res;
  },

  async create(payload: Partial<Medicine>): Promise<Medicine> {
    const res: any = await apiClient.post('/medicines', payload);
    return res.data || res;
  },

  async update(id: string, payload: Partial<Medicine>): Promise<Medicine> {
    const res: any = await apiClient.patch(`/medicines/${id}`, payload);
    return res.data || res;
  },

  async delete(id: string): Promise<{ success: boolean }> {
    const res: any = await apiClient.delete(`/medicines/${id}`);
    return res.data || res;
  },
};
