import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync('pharmacy_offline.db');
      // Enable WAL mode and foreign keys for high-performance and consistency
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
      `);

      await runMigrations(db);
      dbInstance = db;
      return db;
    } catch (error) {
      console.error('[Database Init Error] Failed to open and migrate SQLite database:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}
