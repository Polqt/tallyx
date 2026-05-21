import { getDb } from '@/lib/db';
import type { PaymentItem } from '@/features/payments/payment.types';

export async function cachePayments(items: PaymentItem[]): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const p of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO payments
          (id, credit_id, amount, payment_method, stellar_tx_hash, sync_status,
           created_at, credit_status, credit_amount, credit_balance,
           customer_id, customer_name, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id, p.creditId, p.amount, p.paymentMethod,
          p.stellarTxHash ?? null, p.syncStatus, p.createdAt,
          p.credit.status, p.credit.amount, p.credit.balance,
          p.customer.id, p.customer.name, now,
        ]
      );
    }
  });
}

export async function getCachedPayments(): Promise<PaymentItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    `SELECT * FROM payments ORDER BY created_at DESC LIMIT 200`
  );
  return rows.map(rowToPayment);
}

function rowToPayment(row: any): PaymentItem {
  return {
    id: row.id,
    creditId: row.credit_id,
    amount: row.amount,
    paymentMethod: row.payment_method as 'cash' | 'usdc',
    stellarTxHash: row.stellar_tx_hash ?? null,
    syncStatus: row.sync_status as any,
    createdAt: row.created_at,
    credit: {
      id: row.credit_id,
      amount: row.credit_amount,
      balance: row.credit_balance,
      status: row.credit_status as any,
    },
    customer: {
      id: row.customer_id,
      name: row.customer_name,
    },
  };
}
