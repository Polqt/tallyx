import type { DashboardSummary } from './dashboard.types';
import type { DashboardPeriod } from '@/utils/dashboard';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const PERIOD_PARAM: Record<DashboardPeriod, string> = {
  'All time': 'all',
  'This week': 'week',
  'This month': 'month',
  'This year': 'year',
};

export async function fetchDashboardSummary(token: string, period: DashboardPeriod = 'All time', signal?: AbortSignal) {
  const param = PERIOD_PARAM[period];
  const response = await fetch(`${API_URL}/stores/dashboard?period=${param}`, {
    signal,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? 'Unable to load dashboard.');
  }

  return data as DashboardSummary;
}
