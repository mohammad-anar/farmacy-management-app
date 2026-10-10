import { getDatabase } from '../database';
import { generateUUID } from '../../utils/uuid';

export type SyncOperationType =
  | 'CREATE_MEDICINE'
  | 'UPDATE_MEDICINE'
  | 'DELETE_MEDICINE'
  | 'ADJUST_STOCK'
  | 'RECEIVE_STOCK';

export type SyncEntityType = 'MEDICINE' | 'STOCK' | 'BATCH';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncOutboxEntry {
  id: string;
  operationType: SyncOperationType;
  entityType: SyncEntityType;
  entityId: string;
  clientId?: string | null;
  payload: any;
  createdAt: string;
  retryCount: number;
  lastError?: string | null;
  status: SyncStatus;
}

interface SyncOutboxRow {
  id: string;
  operation_type: string;
  entity_type: string;
  entity_id: string;
  client_id: string | null;
  payload: string;
  created_at: string;
  retry_count: number;
  last_error: string | null;
  status: string;
}

function mapRowToEntry(row: SyncOutboxRow): SyncOutboxEntry {
  let parsedPayload: any = {};
  try {
    parsedPayload = JSON.parse(row.payload);
  } catch (err) {
    parsedPayload = row.payload;
  }

  return {
    id: row.id,
    operationType: row.operation_type as SyncOperationType,
    entityType: row.entity_type as SyncEntityType,
    entityId: row.entity_id,
    clientId: row.client_id,
    payload: parsedPayload,
    createdAt: row.created_at,
    retryCount: row.retry_count,
    lastError: row.last_error,
    status: row.status as SyncStatus,
  };
}

export class SyncOutboxRepository {
  /**
   * Enqueue a new operation to the outbox queue
   */
  static async enqueue(
    operationType: SyncOperationType,
    entityType: SyncEntityType,
    entityId: string,
    payload: any,
    clientId?: string,
    operationId?: string,
  ): Promise<SyncOutboxEntry> {
    const db = await getDatabase();
    const id = operationId || generateUUID();
    const createdAt = new Date().toISOString();
    const serializedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

    await db.runAsync(
      `INSERT INTO sync_outbox (id, operation_type, entity_type, entity_id, client_id, payload, created_at, retry_count, last_error, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 'pending');`,
      [id, operationType, entityType, entityId, clientId || entityId, serializedPayload, createdAt],
    );

    return {
      id,
      operationType,
      entityType,
      entityId,
      clientId: clientId || entityId,
      payload,
      createdAt,
      retryCount: 0,
      lastError: null,
      status: 'pending',
    };
  }

  /**
   * Get all pending operations in FIFO order
   */
  static async getPending(limit = 50): Promise<SyncOutboxEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SyncOutboxRow>(
      `SELECT * FROM sync_outbox WHERE status IN ('pending', 'failed') ORDER BY created_at ASC LIMIT ?;`,
      [limit],
    );
    return rows.map(mapRowToEntry);
  }

  /**
   * Get total count of pending operations
   */
  static async getPendingCount(): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM sync_outbox WHERE status IN ('pending', 'syncing', 'failed');`,
    );
    return result?.count || 0;
  }

  /**
   * Mark entries as currently syncing
   */
  static async markSyncing(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE sync_outbox SET status = 'syncing' WHERE id IN (${placeholders});`,
      ids,
    );
  }

  /**
   * Remove operations confirmed as synced by server
   */
  static async markSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
      `DELETE FROM sync_outbox WHERE id IN (${placeholders});`,
      ids,
    );
  }

  /**
   * Mark operation as failed with error message and increment retry count
   */
  static async markFailed(id: string, error: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sync_outbox SET status = 'failed', retry_count = retry_count + 1, last_error = ? WHERE id = ?;`,
      [error, id],
    );
  }

  /**
   * Reset 'syncing' entries back to 'pending' (e.g. after crash / app restart)
   */
  static async resetInFlightOperations(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE sync_outbox SET status = 'pending' WHERE status = 'syncing';`,
    );
  }

  /**
   * Clear all outbox entries (e.g. on explicit clean user logout)
   */
  static async clearAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM sync_outbox;`);
  }
}
