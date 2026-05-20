export type CreditStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'voided';
export type CreditSyncStatus = 'local' | 'pending' | 'syncing' | 'synced' | 'failed';

export interface CreditListItem {
  id: string;
  storeId: string;
  customerId: string;
  customerName?: string | null;
  amount: number;
  balance: number;
  status: CreditStatus;
  note?: string | null;
  dueDate?: string | null;
  stellarTxHash?: string | null;
  syncStatus: CreditSyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreditListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CreditListResponse {
  items: CreditListItem[];
  pagination: CreditListPagination;
}

export interface FetchCreditsParams {
  page?: number;
  limit?: number;
  customerId?: string;
  status?: CreditStatus;
  signal?: AbortSignal;
}

export interface CreateCreditInput {
  customerId: string;
  amount: number;
  dueDate?: string;
  note?: string;
}
