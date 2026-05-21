import { getDb } from '@/lib/db';
import type { CustomerListItem } from '@/features/customers/customer.types';

export async function cacheCustomers(items: CustomerListItem[]): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const c of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO customers
          (id, store_id, qr_identity, name, phone, balance, last_transaction_date, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.storeId, c.qrIdentity, c.name, c.phone ?? null, c.balance, c.lastTransactionDate ?? null, now]
      );
    }
  });
}

export async function getCachedCustomers(query?: string): Promise<CustomerListItem[]> {
  const db = await getDb();
  let rows: any[];
  if (query && query.trim()) {
    const pattern = `%${query.trim()}%`;
    rows = await db.getAllAsync(
      `SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY cached_at DESC LIMIT 200`,
      [pattern, pattern]
    );
  } else {
    rows = await db.getAllAsync(
      `SELECT * FROM customers ORDER BY cached_at DESC LIMIT 200`
    );
  }
  return rows.map(rowToCustomer);
}

function rowToCustomer(row: any): CustomerListItem {
  return {
    id: row.id,
    storeId: row.store_id,
    qrIdentity: row.qr_identity,
    name: row.name,
    phone: row.phone ?? null,
    balance: row.balance,
    lastTransactionDate: row.last_transaction_date ?? null,
  };
}
