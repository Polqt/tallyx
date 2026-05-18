import type { DashboardSummary } from './dashboard.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function fetchDashboardSummary(token: string, signal?: AbortSignal) {
  const response = await fetch(`${API_URL}/stores/dashboard`, {
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
