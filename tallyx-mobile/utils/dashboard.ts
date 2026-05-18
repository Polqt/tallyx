import type { DashboardSummary } from '@/features/dashboard/dashboard.types';

export const DASHBOARD_PERIODS = ['All time', 'This week', 'This month', 'This year'] as const;

export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

export const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  totals: {
    totalReceivables: 0,
    overdueAmount: 0,
    customerCount: 0,
    openCreditsCount: 0,
  },
  recentActivity: [],
};

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function compactKey(key: string) {
  if (key.length <= 14) return key;
  return `${key.slice(0, 6)}...${key.slice(-6)}`;
}

export function formatPeso(value: number) {
  return `\u20b1${Math.round(value).toLocaleString()}`;
}

export function formatDashboardDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}
