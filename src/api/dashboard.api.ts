import { apiClient } from './client';
import { DashboardSummary } from '../types';

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    const res: any = await apiClient.get('/dashboard/summary');
    return res.data || res;
  },
};
