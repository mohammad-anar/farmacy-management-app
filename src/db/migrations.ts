import { SQLiteDatabase } from 'expo-sqlite';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_offline_schema',
    up: async (db: SQLiteDatabase) => {
      // 1. Medicines Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS medicines (
          id TEXT PRIMARY KEY,
          client_id TEXT UNIQUE NOT NULL,
          server_id TEXT,
          name TEXT NOT NULL,
          selling_price REAL NOT NULL,
          quantity REAL NOT NULL,
          generic_name TEXT,
          brand_name TEXT,
          manufacturer TEXT,
          strength TEXT,
          dosage_form TEXT,
          category TEXT,
          barcode TEXT,
          purchase_price REAL,
          minimum_stock REAL,
          rack_location TEXT,
          supplier_name TEXT,
          batch_number TEXT,
          expiry_date TEXT,
          image_url TEXT,
          notes TEXT,
          online_purchase_url TEXT,
          is_deleted INTEGER DEFAULT 0,
          sync_status TEXT DEFAULT 'synced',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines (name);
        CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON medicines (generic_name);
        CREATE INDEX IF NOT EXISTS idx_medicines_brand_name ON medicines (brand_name);
        CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines (barcode);
        CREATE INDEX IF NOT EXISTS idx_medicines_is_deleted ON medicines (is_deleted);
        CREATE INDEX IF NOT EXISTS idx_medicines_sync_status ON medicines (sync_status);
      `);

      // 2. Batches Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS batches (
          id TEXT PRIMARY KEY,
          medicine_id TEXT NOT NULL,
          batch_number TEXT NOT NULL,
          quantity REAL NOT NULL,
          expiry_date TEXT,
          purchase_price REAL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (medicine_id) REFERENCES medicines (id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_batches_medicine_id ON batches (medicine_id);
      `);

      // 3. Stock History Table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS stock_history (
          id TEXT PRIMARY KEY,
          medicine_id TEXT NOT NULL,
          change_type TEXT NOT NULL,
          quantity_before REAL NOT NULL,
          quantity_changed REAL NOT NULL,
          quantity_after REAL NOT NULL,
          batch_number TEXT,
          unit_purchase_cost REAL,
          reason TEXT,
          timestamp TEXT NOT NULL,
          sync_status TEXT DEFAULT 'synced'
        );

        CREATE INDEX IF NOT EXISTS idx_stock_history_medicine ON stock_history (medicine_id);
        CREATE INDEX IF NOT EXISTS idx_stock_history_timestamp ON stock_history (timestamp);
      `);

      // 4. Sync Outbox Table (Durable Queue)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_outbox (
          id TEXT PRIMARY KEY,
          operation_type TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          client_id TEXT,
          payload TEXT NOT NULL,
          created_at TEXT NOT NULL,
          retry_count INTEGER DEFAULT 0,
          last_error TEXT,
          status TEXT DEFAULT 'pending'
        );

        CREATE INDEX IF NOT EXISTS idx_sync_outbox_status ON sync_outbox (status);
        CREATE INDEX IF NOT EXISTS idx_sync_outbox_created_at ON sync_outbox (created_at);
      `);

      // 5. Sync Metadata Table (Checkpoints, Cursors, Schema Version)
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    },
  },
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Create migration tracking table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedRows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM _migrations ORDER BY version ASC;',
  );
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`[SQLite Migration] Applying v${migration.version}: ${migration.name}...`);
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?);',
        [migration.version, migration.name, new Date().toISOString()],
      );
      console.log(`[SQLite Migration] v${migration.version} applied successfully.`);
    }
  }
}
