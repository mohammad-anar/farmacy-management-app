import { getDatabase } from '../database';

export const SyncMetadataRepository = {
  async get(key: string): Promise<string | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?;',
      [key],
    );
    return row ? row.value : null;
  },

  async set(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO sync_metadata (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
      [key, value, now],
    );
  },

  async getLastSyncTime(): Promise<string | null> {
    return this.get('last_sync_time');
  },

  async setLastSyncTime(timestamp: string): Promise<void> {
    await this.set('last_sync_time', timestamp);
  },

  async getServerCursor(): Promise<string | null> {
    return this.get('server_cursor');
  },

  async setServerCursor(cursor: string): Promise<void> {
    await this.set('server_cursor', cursor);
  },
};
