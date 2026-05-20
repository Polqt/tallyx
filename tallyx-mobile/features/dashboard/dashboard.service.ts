import type { DashboardSummary } from './dashboard.types';
import type { DashboardPeriod } from '@/utils/dashboard';
import { apiRequest } from '@/utils/api-client';

const PERIOD_PARAM: Record<DashboardPeriod, string> = {
  'All time': 'all',
  'This week': 'week',
  'This month': 'month',
  'This year': 'year',
};

export function fetchDashboardSummary(token: string, period: DashboardPeriod = 'All time', signal?: AbortSignal) {
  const param = PERIOD_PARAM[period];
  return apiRequest<DashboardSummary>(`/stores/dashboard?period=${param}`, token, { signal });
}
