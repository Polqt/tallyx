import { getDb } from '@/lib/db';
import type { CreditListItem, CreditStatus } from '@/features/credits/credit.types';

export async function cacheCredits(items: CreditListItem[]): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const c of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO credits
          (id, store_id, customer_id, customer_name, amount, balance, status, note,
           due_date, stellar_tx_hash, sync_status, created_at, updated_at, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          c.id, c.storeId, c.customerId, c.customerName ?? null,
          c.amount, c.balance, c.status, c.note ?? null,
          c.dueDate ?? null, c.stellarTxHash ?? null, c.syncStatus,
          c.createdAt, c.updatedAt, now,
        ]
      );
    }
  });
}

export async function getCachedCredits(opts: {
  customerId?: string;
  status?: CreditStatus;
  query?: string;
}): Promise<CreditListItem[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (opts.customerId) {
    conditions.push('customer_id = ?');
    params.push(opts.customerId);
  }
  if (opts.status) {
    conditions.push('status = ?');
    params.push(opts.status);
  }
  if (opts.query?.trim()) {
    conditions.push('customer_name LIKE ?');
    params.push(`%${opts.query.trim()}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await db.getAllAsync(
    `SELECT * FROM credits ${where} ORDER BY cached_at DESC LIMIT 200`,
    params
  );
  return rows.map(rowToCredit);
}

function rowToCredit(row: any): CreditListItem {
  return {
    id: row.id,
    storeId: row.store_id,
    customerId: row.customer_id,
    customerName: row.customer_name ?? null,
    amount: row.amount,
    balance: row.balance,
    status: row.status as CreditStatus,
    note: row.note ?? null,
    dueDate: row.due_date ?? null,
    stellarTxHash: row.stellar_tx_hash ?? null,
    syncStatus: row.sync_status as any,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
