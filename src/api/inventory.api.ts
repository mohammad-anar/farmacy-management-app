import { apiClient } from './client';
import {
  ExpiringResponse,
  LowStockResponse,
  PaginatedResult,
  StockHistoryItem,
} from '../types';

export const inventoryApi = {
  async getLowStock(): Promise<LowStockResponse> {
    const res: any = await apiClient.get('/inventory/low-stock');
    return res.data || res;
  },

  async getExpiring(days = 30): Promise<ExpiringResponse> {
    const res: any = await apiClient.get('/inventory/expiring', {
      params: { days },
    });
    return res.data || res;
  },

  async getHistory(page = 1, limit = 20, medicineId?: string): Promise<PaginatedResult<StockHistoryItem>> {
    const res: any = await apiClient.get('/inventory/history', {
      params: { page, limit, medicineId },
    });
    return res.data || res;
  },

  async recordReceipt(payload: {
    medicineId: string;
    quantity: number;
    unitPurchaseCost?: number;
    batchNumber?: string;
    expiryDate?: string;
    supplierName?: string;
    notes?: string;
  }) {
    const res: any = await apiClient.post('/inventory/receipts', payload);
    return res.data || res;
  },

  async recordAdjustment(payload: {
    medicineId: string;
    quantityChange: number;
    changeType: string;
    batchNumber?: string;
    reason?: string;
  }) {
    const res: any = await apiClient.post('/inventory/adjustments', payload);
    return res.data || res;
  },
};
