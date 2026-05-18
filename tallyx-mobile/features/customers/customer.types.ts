export interface CustomerListItem {
  id: string;
  name: string;
  phone?: string | null;
  balance: number;
  lastTransactionDate?: string | null;
}

export interface CustomerCredit {
  id: string;
  amount: number;
  balance: number;
  status: string;
  date: string;
  dueDate?: string | null;
  stellarTxHash?: string | null;
}

export interface CustomerDetail {
  id: string;
  name: string;
  phone?: string | null;
  balance: number;
  totalCredit: number;
  totalPaid: number;
  credits: CustomerCredit[];
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
}
