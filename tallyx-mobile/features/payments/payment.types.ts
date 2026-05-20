export type PaymentSyncStatus = 'local' | 'pending' | 'syncing' | 'synced' | 'failed';

export interface PaymentItem {
  id: string;
  creditId: string;
  amount: string;
  paymentMethod: 'cash' | 'usdc';
  stellarTxHash: string | null;
  syncStatus?: PaymentSyncStatus;
  createdAt: string;
  credit: {
    id: string;
    amount: string;
    balance: string;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'voided';
  };
  customer: {
    id: string;
    name: string;
  };
}

export interface RecordPaymentInput {
  creditId: string;
  amount: number;
  paymentMethod: 'cash' | 'usdc';
  stellarTxHash?: string;
}
