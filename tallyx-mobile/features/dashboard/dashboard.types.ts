export interface DashboardTotals {
  totalReceivables: number;
  overdueAmount: number;
  customerCount: number;
  openCreditsCount: number;
}

export interface DashboardActivity {
  id: string;
  type: 'credit';
  title: string;
  amount: number;
  status: string;
  createdAt: string;
  stellarTxHash?: string | null;
}

export interface DashboardSummary {
  totals: DashboardTotals;
  recentActivity: DashboardActivity[];
}
