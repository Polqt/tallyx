import * as SQLite from 'expo-sqlite';

const DB_NAME = 'tallyx_cache.db';

let _db: SQLite.SQLiteDatabase | null = null;
let _dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (_dbInitPromise) return _dbInitPromise;

  _dbInitPromise = (async () => {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
    await migrate(db);
    _db = db;
    return db;
  })();

  try {
    return await _dbInitPromise;
  } finally {
    _dbInitPromise = null;
  }
}

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      qr_identity TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      balance REAL NOT NULL DEFAULT 0,
      last_transaction_date TEXT,
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credits (
      id TEXT PRIMARY KEY,
      store_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT,
      amount REAL NOT NULL,
      balance REAL NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      due_date TEXT,
      stellar_tx_hash TEXT,
      sync_status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      credit_id TEXT NOT NULL,
      amount TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      stellar_tx_hash TEXT,
      sync_status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      credit_status TEXT NOT NULL,
      credit_amount TEXT NOT NULL,
      credit_balance TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      cached_at INTEGER NOT NULL
    );
  `);
}
