export interface CustomerListItem {
  id: string;
  storeId: string;
  qrIdentity: string;
  name: string;
  phone?: string | null;
  balance: number;
  lastTransactionDate?: string | null;
}

export interface CustomerListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CustomerListResponse {
  items: CustomerListItem[];
  pagination: CustomerListPagination;
}

export interface FetchCustomersParams {
  page?: number;
  limit?: number;
  query?: string;
  signal?: AbortSignal;
}

export interface CustomerCredit {
  id: string;
  amount: number;
  balance: number;
  status: string;
  note?: string | null;
  date: string;
  dueDate?: string | null;
  stellarTxHash?: string | null;
  syncStatus?: string | null;
}

export interface CustomerPayment {
  id: string;
  creditId: string;
  amount: number;
  date: string;
  stellarTxHash?: string | null;
}

export interface CustomerDetail {
  id: string;
  storeId: string;
  qrIdentity: string;
  name: string;
  phone?: string | null;
  balance: number;
  totalCredit: number;
  totalPaid: number;
  credits: CustomerCredit[];
  payments: CustomerPayment[];
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string | null;
}
