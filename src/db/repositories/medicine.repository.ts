import { getDatabase } from '../database';
import { Medicine, Batch, StockHistoryItem, DashboardSummary, LowStockItem, ExpiringItem } from '../../types';
import { generateUUID } from '../../utils/uuid';

export interface SQLiteMedicineRow {
  id: string;
  client_id: string;
  server_id: string | null;
  name: string;
  selling_price: number;
  quantity: number;
  generic_name: string | null;
  brand_name: string | null;
  manufacturer: string | null;
  strength: string | null;
  dosage_form: string | null;
  category: string | null;
  barcode: string | null;
  purchase_price: number | null;
  minimum_stock: number | null;
  rack_location: string | null;
  supplier_name: string | null;
  batch_number: string | null;
  expiry_date: string | null;
  image_url: string | null;
  notes: string | null;
  online_purchase_url: string | null;
  is_deleted: number;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

export interface SQLiteBatchRow {
  id: string;
  medicine_id: string;
  batch_number: string;
  quantity: number;
  expiry_date: string | null;
  purchase_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface SQLiteStockHistoryRow {
  id: string;
  medicine_id: string;
  change_type: string;
  quantity_before: number;
  quantity_changed: number;
  quantity_after: number;
  batch_number: string | null;
  unit_purchase_cost: number | null;
  reason: string | null;
  timestamp: string;
  sync_status: string;
}

function mapRowToMedicine(row: SQLiteMedicineRow, batches: Batch[] = [], stockHistories: StockHistoryItem[] = []): Medicine {
  return {
    id: row.server_id || row.id,
    name: row.name,
    sellingPrice: row.selling_price,
    quantity: row.quantity,
    genericName: row.generic_name,
    brandName: row.brand_name,
    manufacturer: row.manufacturer,
    strength: row.strength,
    dosageForm: row.dosage_form,
    category: row.category,
    barcode: row.barcode,
    purchasePrice: row.purchase_price !== null ? row.purchase_price : null,
    minimumStock: row.minimum_stock !== null ? row.minimum_stock : null,
    rackLocation: row.rack_location,
    supplierName: row.supplier_name,
    batchNumber: row.batch_number,
    expiryDate: row.expiry_date,
    imageUrl: row.image_url,
    notes: row.notes,
    onlinePurchaseUrl: row.online_purchase_url,
    isDeleted: row.is_deleted === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    batches,
    stockHistories,
  };
}

export class MedicineRepository {
  /**
   * Save or update a single medicine in SQLite
   */
  static async upsert(
    med: Partial<Medicine> & { name: string; sellingPrice: number; quantity: number },
    syncStatus: 'synced' | 'pending' | 'syncing' | 'failed' = 'synced',
    clientId?: string,
    serverId?: string,
  ): Promise<Medicine> {
    const db = await getDatabase();
    const id = med.id || clientId || generateUUID();
    const resolvedClientId = clientId || id;
    const resolvedServerId = serverId || (med.id && !med.id.startsWith('med_') ? med.id : null);
    const now = new Date().toISOString();
    const createdAt = med.createdAt || now;
    const updatedAt = now;

    await db.runAsync(
      `INSERT INTO medicines (
        id, client_id, server_id, name, selling_price, quantity,
        generic_name, brand_name, manufacturer, strength, dosage_form,
        category, barcode, purchase_price, minimum_stock, rack_location,
        supplier_name, batch_number, expiry_date, image_url, notes,
        online_purchase_url, is_deleted, sync_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        client_id = excluded.client_id,
        server_id = COALESCE(excluded.server_id, medicines.server_id),
        name = excluded.name,
        selling_price = excluded.selling_price,
        quantity = excluded.quantity,
        generic_name = excluded.generic_name,
        brand_name = excluded.brand_name,
        manufacturer = excluded.manufacturer,
        strength = excluded.strength,
        dosage_form = excluded.dosage_form,
        category = excluded.category,
        barcode = excluded.barcode,
        purchase_price = excluded.purchase_price,
        minimum_stock = excluded.minimum_stock,
        rack_location = excluded.rack_location,
        supplier_name = excluded.supplier_name,
        batch_number = excluded.batch_number,
        expiry_date = excluded.expiry_date,
        image_url = excluded.image_url,
        notes = excluded.notes,
        online_purchase_url = excluded.online_purchase_url,
        is_deleted = excluded.is_deleted,
        sync_status = excluded.sync_status,
        updated_at = excluded.updated_at;`,
      [
        id,
        resolvedClientId,
        resolvedServerId,
        med.name,
        med.sellingPrice,
        med.quantity,
        med.genericName || null,
        med.brandName || null,
        med.manufacturer || null,
        med.strength || null,
        med.dosageForm || null,
        med.category || null,
        med.barcode || null,
        med.purchasePrice !== undefined && med.purchasePrice !== null ? med.purchasePrice : null,
        med.minimumStock !== undefined && med.minimumStock !== null ? med.minimumStock : null,
        med.rackLocation || null,
        med.supplierName || null,
        med.batchNumber || null,
        med.expiryDate || null,
        med.imageUrl || null,
        med.notes || null,
        med.onlinePurchaseUrl || null,
        med.isDeleted ? 1 : 0,
        syncStatus,
        createdAt,
        updatedAt,
      ],
    );

    // If batches are provided, persist them
    if (med.batches && med.batches.length > 0) {
      for (const batch of med.batches) {
        await db.runAsync(
          `INSERT INTO batches (id, medicine_id, batch_number, quantity, expiry_date, purchase_price, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             quantity = excluded.quantity,
             expiry_date = excluded.expiry_date,
             purchase_price = excluded.purchase_price,
             updated_at = excluded.updated_at;`,
          [
            batch.id || generateUUID(),
            id,
            batch.batchNumber,
            batch.quantity,
            batch.expiryDate || null,
            batch.purchasePrice || null,
            batch.createdAt || now,
            batch.updatedAt || now,
          ],
        );
      }
    }

    const saved = await this.findById(id);
    return saved!;
  }

  /**
   * Bulk upsert medicines for initial/pull synchronization
   */
  static async upsertMany(medicines: Medicine[], syncStatus: 'synced' | 'pending' = 'synced'): Promise<void> {
    const db = await getDatabase();
    await db.execAsync('BEGIN TRANSACTION;');
    try {
      for (const med of medicines) {
        const id = med.id;
        const now = new Date().toISOString();

        // Remove any old temporary client-side row with this server_id or matching client_id
        await db.runAsync(
          `DELETE FROM medicines WHERE (server_id = ? OR client_id = ?) AND id != ?;`,
          [id, id, id],
        );

        await db.runAsync(
          `INSERT INTO medicines (
            id, client_id, server_id, name, selling_price, quantity,
            generic_name, brand_name, manufacturer, strength, dosage_form,
            category, barcode, purchase_price, minimum_stock, rack_location,
            supplier_name, batch_number, expiry_date, image_url, notes,
            online_purchase_url, is_deleted, sync_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            server_id = excluded.server_id,
            name = excluded.name,
            selling_price = excluded.selling_price,
            quantity = excluded.quantity,
            generic_name = excluded.generic_name,
            brand_name = excluded.brand_name,
            manufacturer = excluded.manufacturer,
            strength = excluded.strength,
            dosage_form = excluded.dosage_form,
            category = excluded.category,
            barcode = excluded.barcode,
            purchase_price = excluded.purchase_price,
            minimum_stock = excluded.minimum_stock,
            rack_location = excluded.rack_location,
            supplier_name = excluded.supplier_name,
            batch_number = excluded.batch_number,
            expiry_date = excluded.expiry_date,
            image_url = excluded.image_url,
            notes = excluded.notes,
            online_purchase_url = excluded.online_purchase_url,
            is_deleted = excluded.is_deleted,
            sync_status = excluded.sync_status,
            updated_at = excluded.updated_at;`,
          [
            id,
            id,
            id,
            med.name,
            med.sellingPrice,
            med.quantity,
            med.genericName || null,
            med.brandName || null,
            med.manufacturer || null,
            med.strength || null,
            med.dosageForm || null,
            med.category || null,
            med.barcode || null,
            med.purchasePrice !== undefined && med.purchasePrice !== null ? med.purchasePrice : null,
            med.minimumStock !== undefined && med.minimumStock !== null ? med.minimumStock : null,
            med.rackLocation || null,
            med.supplierName || null,
            med.batchNumber || null,
            med.expiryDate || null,
            med.imageUrl || null,
            med.notes || null,
            med.onlinePurchaseUrl || null,
            med.isDeleted ? 1 : 0,
            syncStatus,
            med.createdAt || now,
            med.updatedAt || now,
          ],
        );

        if (med.batches && med.batches.length > 0) {
          for (const b of med.batches) {
            await db.runAsync(
              `INSERT INTO batches (id, medicine_id, batch_number, quantity, expiry_date, purchase_price, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 quantity = excluded.quantity,
                 expiry_date = excluded.expiry_date,
                 purchase_price = excluded.purchase_price,
                 updated_at = excluded.updated_at;`,
              [
                b.id,
                id,
                b.batchNumber,
                b.quantity,
                b.expiryDate || null,
                b.purchasePrice || null,
                b.createdAt || now,
                b.updatedAt || now,
              ],
            );
          }
        }
      }
      await db.execAsync('COMMIT;');
    } catch (err) {
      await db.execAsync('ROLLBACK;');
      throw err;
    }
  }

  /**
   * Find a medicine by ID (client_id, server_id, or primary key id)
   */
  static async findById(id: string): Promise<Medicine | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SQLiteMedicineRow>(
      `SELECT * FROM medicines WHERE (id = ? OR client_id = ? OR server_id = ?) AND is_deleted = 0 LIMIT 1;`,
      [id, id, id],
    );
    if (!row) return null;

    const batches = await db.getAllAsync<SQLiteBatchRow>(
      `SELECT * FROM batches WHERE medicine_id = ? ORDER BY expiry_date ASC;`,
      [row.id],
    );

    const historyRows = await db.getAllAsync<SQLiteStockHistoryRow>(
      `SELECT * FROM stock_history WHERE medicine_id = ? ORDER BY timestamp DESC LIMIT 20;`,
      [row.id],
    );

    return mapRowToMedicine(
      row,
      batches.map((b) => ({
        id: b.id,
        medicineId: b.medicine_id,
        batchNumber: b.batch_number,
        quantity: b.quantity,
        expiryDate: b.expiry_date,
        purchasePrice: b.purchase_price,
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      })),
      historyRows.map((h) => ({
        id: h.id,
        medicineId: h.medicine_id,
        changeType: h.change_type as any,
        quantityBefore: h.quantity_before,
        quantityChanged: h.quantity_changed,
        quantityAfter: h.quantity_after,
        batchNumber: h.batch_number,
        unitPurchaseCost: h.unit_purchase_cost,
        reason: h.reason,
        timestamp: h.timestamp,
      })),
    );
  }

  /**
   * Search medicines locally in SQLite
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
    const db = await getDatabase();
    const {
      query = '',
      category,
      dosageForm,
      isLowStock,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    const offset = (page - 1) * limit;
    const conditions: string[] = ['is_deleted = 0'];
    const params: any[] = [];

    if (query.trim()) {
      const q = `%${query.trim()}%`;
      conditions.push(`(
        name LIKE ? OR
        generic_name LIKE ? OR
        brand_name LIKE ? OR
        manufacturer LIKE ? OR
        barcode LIKE ? OR
        rack_location LIKE ?
      )`);
      params.push(q, q, q, q, q, q);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (dosageForm) {
      conditions.push('dosage_form = ?');
      params.push(dosageForm);
    }

    if (isLowStock) {
      conditions.push('minimum_stock IS NOT NULL AND quantity <= minimum_stock');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query with deduplication
    const countResult = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(DISTINCT LOWER(TRIM(name))) as total FROM medicines ${whereClause};`,
      params,
    );
    const total = countResult?.total || 0;

    // Allowed sort columns
    const allowedSortCols: Record<string, string> = {
      name: 'name',
      sellingPrice: 'selling_price',
      quantity: 'quantity',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      expiryDate: 'expiry_date',
    };
    const sortCol = allowedSortCols[sortBy] || 'name';
    const direction = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const rows = await db.getAllAsync<SQLiteMedicineRow>(
      `SELECT * FROM medicines ${whereClause} GROUP BY LOWER(TRIM(name)) ORDER BY ${sortCol} ${direction} LIMIT ? OFFSET ?;`,
      [...params, limit, offset],
    );

    const items = rows.map((r) => mapRowToMedicine(r));
    return { items, total };
  }

  /**
   * Delete a medicine locally and immediately hide from catalog
   */
  static async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const med = await this.findById(id);
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE medicines SET is_deleted = 1, sync_status = 'pending', updated_at = ? WHERE id = ? OR client_id = ? OR server_id = ?;`,
      [now, id, id, id],
    );

    if (med?.name) {
      await db.runAsync(
        `UPDATE medicines SET is_deleted = 1, sync_status = 'pending', updated_at = ? WHERE LOWER(TRIM(name)) = LOWER(TRIM(?));`,
        [now, med.name],
      );
    }
  }

  /**
   * Apply stock adjustment locally and append to stock history
   */
  static async adjustStock(
    medicineId: string,
    delta: number,
    reason?: string,
    changeType: string = 'STOCK_ADJUSTMENT',
  ): Promise<Medicine> {
    const db = await getDatabase();
    const med = await this.findById(medicineId);
    if (!med) throw new Error('Medicine not found');

    const qtyBefore = med.quantity;
    const qtyAfter = Math.max(0, qtyBefore + delta);
    const now = new Date().toISOString();
    const historyId = generateUUID();

    await db.execAsync('BEGIN TRANSACTION;');
    try {
      await db.runAsync(
        `UPDATE medicines SET quantity = ?, sync_status = 'pending', updated_at = ? WHERE id = ? OR client_id = ? OR server_id = ?;`,
        [qtyAfter, now, medicineId, medicineId, medicineId],
      );

      await db.runAsync(
        `INSERT INTO stock_history (id, medicine_id, change_type, quantity_before, quantity_changed, quantity_after, batch_number, unit_purchase_cost, reason, timestamp, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, 'pending');`,
        [historyId, med.id, changeType, qtyBefore, delta, qtyAfter, reason || null, now],
      );

      await db.execAsync('COMMIT;');
    } catch (err) {
      await db.execAsync('ROLLBACK;');
      throw err;
    }

    const updated = await this.findById(medicineId);
    return updated!;
  }

  /**
   * Receive stock locally (with optional batch and supplier)
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
    const db = await getDatabase();
    const med = await this.findById(medicineId);
    if (!med) throw new Error('Medicine not found');

    const qtyBefore = med.quantity;
    const qtyAfter = qtyBefore + quantity;
    const now = new Date().toISOString();
    const historyId = generateUUID();

    await db.execAsync('BEGIN TRANSACTION;');
    try {
      await db.runAsync(
        `UPDATE medicines SET quantity = ?, sync_status = 'pending', updated_at = ? WHERE id = ? OR client_id = ? OR server_id = ?;`,
        [qtyAfter, now, medicineId, medicineId, medicineId],
      );

      if (options?.batchNumber) {
        const batchId = generateUUID();
        await db.runAsync(
          `INSERT INTO batches (id, medicine_id, batch_number, quantity, expiry_date, purchase_price, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             quantity = quantity + excluded.quantity,
             expiry_date = COALESCE(excluded.expiry_date, batches.expiry_date),
             updated_at = excluded.updated_at;`,
          [
            batchId,
            med.id,
            options.batchNumber,
            quantity,
            options.expiryDate || null,
            options.purchasePrice || null,
            now,
            now,
          ],
        );
      }

      await db.runAsync(
        `INSERT INTO stock_history (id, medicine_id, change_type, quantity_before, quantity_changed, quantity_after, batch_number, unit_purchase_cost, reason, timestamp, sync_status)
         VALUES (?, ?, 'STOCK_RECEIVED', ?, ?, ?, ?, ?, ?, ?, 'pending');`,
        [
          historyId,
          med.id,
          qtyBefore,
          quantity,
          qtyAfter,
          options?.batchNumber || null,
          options?.purchasePrice || null,
          options?.reason || (options?.supplierName ? `Received from ${options.supplierName}` : 'Stock received'),
          now,
        ],
      );

      await db.execAsync('COMMIT;');
    } catch (err) {
      await db.execAsync('ROLLBACK;');
      throw err;
    }

    const updated = await this.findById(medicineId);
    return updated!;
  }

  /**
   * Get Low Stock medicines
   */
  static async getLowStock(): Promise<LowStockItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SQLiteMedicineRow>(
      `SELECT * FROM medicines WHERE is_deleted = 0 AND minimum_stock IS NOT NULL AND quantity <= minimum_stock ORDER BY (minimum_stock - quantity) DESC;`,
    );

    return rows.map((r) => ({
      id: r.server_id || r.id,
      name: r.name,
      genericName: r.generic_name,
      brandName: r.brand_name,
      manufacturer: r.manufacturer,
      strength: r.strength,
      dosageForm: r.dosage_form,
      currentQuantity: r.quantity,
      minimumStock: r.minimum_stock || 0,
      shortage: Math.max(0, (r.minimum_stock || 0) - r.quantity),
      rackLocation: r.rack_location,
      supplierName: r.supplier_name,
      onlinePurchaseUrl: r.online_purchase_url,
    }));
  }

  /**
   * Get Expiring & Expired medicines
   */
  static async getExpiring(windowDays = 90): Promise<{ expired: ExpiringItem[]; expiringSoon: ExpiringItem[] }> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SQLiteMedicineRow>(
      `SELECT * FROM medicines WHERE is_deleted = 0 AND expiry_date IS NOT NULL AND expiry_date != '' ORDER BY expiry_date ASC;`,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expired: ExpiringItem[] = [];
    const expiringSoon: ExpiringItem[] = [];

    for (const r of rows) {
      if (!r.expiry_date) continue;
      const expDate = new Date(r.expiry_date);
      const diffTime = expDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const item: ExpiringItem = {
        medicineId: r.server_id || r.id,
        name: r.name,
        genericName: r.generic_name,
        brandName: r.brand_name,
        batchNumber: r.batch_number,
        totalQuantity: r.quantity,
        expiryDate: r.expiry_date,
        daysRemaining,
        scope: 'MEDICINE_LEVEL',
        status: daysRemaining < 0 ? 'EXPIRED' : 'EXPIRING_SOON',
      };

      if (daysRemaining < 0) {
        expired.push(item);
      } else if (daysRemaining <= windowDays) {
        expiringSoon.push(item);
      }
    }

    return { expired, expiringSoon };
  }

  /**
   * Compute aggregated dashboard metrics locally in SQLite
   */
  static async getDashboardSummary(): Promise<DashboardSummary> {
    const db = await getDatabase();
    const stats = await db.getFirstAsync<{
      total_medicines: number;
      total_units: number;
      selling_val: number;
      cost_val: number;
      low_stock: number;
    }>(`
      SELECT 
        COUNT(*) as total_medicines,
        COALESCE(SUM(quantity), 0) as total_units,
        COALESCE(SUM(quantity * selling_price), 0) as selling_val,
        COALESCE(SUM(quantity * COALESCE(purchase_price, 0)), 0) as cost_val,
        COALESCE(SUM(CASE WHEN minimum_stock IS NOT NULL AND quantity <= minimum_stock THEN 1 ELSE 0 END), 0) as low_stock
      FROM medicines
      WHERE is_deleted = 0;
    `);

    const { expired, expiringSoon } = await this.getExpiring(90);

    return {
      totalMedicines: stats?.total_medicines || 0,
      totalStockUnits: stats?.total_units || 0,
      totalSellingValue: Math.round((stats?.selling_val || 0) * 100) / 100,
      totalCostValue: Math.round((stats?.cost_val || 0) * 100) / 100,
      lowStockCount: stats?.low_stock || 0,
      expiringSoonCount: expiringSoon.length,
      expiredCount: expired.length,
    };
  }

  /**
   * Replace a temporary client ID with canonical server ID after push confirmation
   */
  static async reconcileServerId(clientId: string, serverId: string): Promise<void> {
    const db = await getDatabase();
    await db.execAsync('BEGIN TRANSACTION;');
    try {
      // 1. If another row already exists with id = serverId, delete client row
      const existing = await db.getFirstAsync<{ id: string }>(
        `SELECT id FROM medicines WHERE id = ?;`,
        [serverId],
      );

      if (existing) {
        await db.runAsync(`DELETE FROM medicines WHERE (client_id = ? OR id = ?) AND id != ?;`, [
          clientId,
          clientId,
          serverId,
        ]);
      } else {
        // 2. Update existing row primary key and server_id to serverId
        await db.runAsync(
          `UPDATE medicines SET id = ?, server_id = ?, sync_status = 'synced' WHERE client_id = ? OR id = ?;`,
          [serverId, serverId, clientId, clientId],
        );
      }

      // 3. Update relational tables
      await db.runAsync(`UPDATE batches SET medicine_id = ? WHERE medicine_id = ?;`, [serverId, clientId]);
      await db.runAsync(`UPDATE stock_history SET medicine_id = ? WHERE medicine_id = ?;`, [serverId, clientId]);
      await db.execAsync('COMMIT;');
    } catch (err) {
      await db.execAsync('ROLLBACK;');
      console.warn('[MedicineRepository] reconcileServerId error:', err);
    }
  }

  /**
   * Clean up any existing duplicate medicine records
   */
  static async cleanupDuplicates(): Promise<void> {
    try {
      const db = await getDatabase();
      // Remove older duplicates where same name, selling_price, and server_id exists
      await db.runAsync(`
        DELETE FROM medicines 
        WHERE id NOT IN (
          SELECT MAX(id) 
          FROM medicines 
          WHERE is_deleted = 0
          GROUP BY LOWER(TRIM(name)), selling_price, COALESCE(server_id, '')
        ) AND is_deleted = 0;
      `);
    } catch (err) {
      console.warn('[MedicineRepository] cleanupDuplicates error:', err);
    }
  }
}
