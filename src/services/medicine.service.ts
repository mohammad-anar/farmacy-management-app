import { MedicineRepository } from '../db/repositories/medicine.repository';
import { SyncOutboxRepository } from '../db/repositories/sync-outbox.repository';
import { Medicine, DashboardSummary, LowStockItem, ExpiringItem } from '../types';
import { generateUUID } from '../utils/uuid';
import { syncService } from './sync.service';

export class MedicineService {
  /**
   * Search medicines from local SQLite
   */
  static async search(options: {
    query?: string;
    category?: string;
    dosageForm?: string;
    isLowStock?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: Medicine[]; total: number }> {
    return MedicineRepository.search(options);
  }

  /**
   * Get single medicine by ID from SQLite
   */
  static async getById(id: string): Promise<Medicine | null> {
    return MedicineRepository.findById(id);
  }

  /**
   * Create medicine offline-first:
   * 1. Persist in SQLite with client UUID
   * 2. Enqueue CREATE_MEDICINE in SyncOutbox
   * 3. Trigger background sync if online
   */
  static async createMedicine(data: Partial<Medicine> & { name: string; sellingPrice: number; quantity: number }): Promise<Medicine> {
    const clientEntityId = `med_${generateUUID()}`;
    const operationId = generateUUID();

    const localRecord = await MedicineRepository.upsert(
      { ...data, id: clientEntityId },
      'pending',
      clientEntityId,
    );

    await SyncOutboxRepository.enqueue(
      'CREATE_MEDICINE',
      'MEDICINE',
      clientEntityId,
      data,
      clientEntityId,
      operationId,
    );

    // Opportunistic sync attempt
    syncService.triggerSyncIfOnline();

    return localRecord;
  }

  /**
   * Update medicine offline-first:
   * 1. Update in SQLite
   * 2. Enqueue UPDATE_MEDICINE in SyncOutbox
   * 3. Trigger background sync if online
   */
  static async updateMedicine(id: string, data: Partial<Medicine>): Promise<Medicine> {
    const operationId = generateUUID();

    const current = await MedicineRepository.findById(id);
    if (!current) throw new Error('Medicine not found in local database');

    const merged = { ...current, ...data };
    const localRecord = await MedicineRepository.upsert(merged, 'pending', current.id);

    await SyncOutboxRepository.enqueue(
      'UPDATE_MEDICINE',
      'MEDICINE',
      id,
      data,
      current.id,
      operationId,
    );

    syncService.triggerSyncIfOnline();

    return localRecord;
  }

  /**
   * Delete medicine offline-first:
   * 1. Soft-delete locally in SQLite
   * 2. Enqueue DELETE_MEDICINE in SyncOutbox
   */
  static async deleteMedicine(id: string): Promise<void> {
    const operationId = generateUUID();
    await MedicineRepository.delete(id);

    await SyncOutboxRepository.enqueue(
      'DELETE_MEDICINE',
      'MEDICINE',
      id,
      { id },
      id,
      operationId,
    );

    syncService.triggerSyncIfOnline();
  }

  /**
   * Adjust stock offline-first:
   * 1. Update quantity and append history in SQLite
   * 2. Enqueue ADJUST_STOCK in SyncOutbox
   */
  static async adjustStock(
    medicineId: string,
    delta: number,
    reason?: string,
    changeType: string = 'STOCK_ADJUSTMENT',
  ): Promise<Medicine> {
    const operationId = generateUUID();
    const updated = await MedicineRepository.adjustStock(medicineId, delta, reason, changeType);

    await SyncOutboxRepository.enqueue(
      'ADJUST_STOCK',
      'STOCK',
      medicineId,
      { delta, reason, changeType },
      medicineId,
      operationId,
    );

    syncService.triggerSyncIfOnline();

    return updated;
  }

  /**
   * Receive stock offline-first:
   * 1. Update quantity, batch, and history in SQLite
   * 2. Enqueue RECEIVE_STOCK in SyncOutbox
   */
  static async receiveStock(
    medicineId: string,
    quantity: number,
    options?: {
      batchNumber?: string;
      expiryDate?: string;
      purchasePrice?: number;
      supplierName?: string;
      reason?: string;
    },
  ): Promise<Medicine> {
    const operationId = generateUUID();
    const updated = await MedicineRepository.receiveStock(medicineId, quantity, options);

    await SyncOutboxRepository.enqueue(
      'RECEIVE_STOCK',
      'STOCK',
      medicineId,
      { quantity, ...options },
      medicineId,
      operationId,
    );

    syncService.triggerSyncIfOnline();

    return updated;
  }

  /**
   * Get Low Stock items locally
   */
  static async getLowStock(): Promise<LowStockItem[]> {
    return MedicineRepository.getLowStock();
  }

  /**
   * Get Expiring items locally
   */
  static async getExpiring(windowDays = 90): Promise<{ expired: ExpiringItem[]; expiringSoon: ExpiringItem[] }> {
    return MedicineRepository.getExpiring(windowDays);
  }

  /**
   * Get local dashboard summary
   */
  static async getDashboardSummary(): Promise<DashboardSummary> {
    return MedicineRepository.getDashboardSummary();
  }
}
