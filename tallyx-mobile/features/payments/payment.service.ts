import type { PaymentItem, RecordPaymentInput } from './payment.types';
import { apiRequest } from '@/utils/api-client';
import { cachePayments, getCachedPayments } from '@/lib/cache/payments.cache';

export interface PaymentsPage {
  items: PaymentItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function fetchPayments(
  token: string,
  cursor?: string,
  signal?: AbortSignal
): Promise<PaymentsPage> {
  const params = new URLSearchParams({ limit: '50' });
  if (cursor) params.set('cursor', cursor);
  try {
    const data = await apiRequest<PaymentsPage>(`/payments?${params}`, token, { signal });
    if (!cursor) {
      cachePayments(data.items).catch(() => {});
    }
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    if (cursor) throw err;
    const cached = await getCachedPayments();
    return { items: cached, hasMore: false, nextCursor: null };
  }
}

export function fetchPayment(token: string, id: string, signal?: AbortSignal) {
  return apiRequest<PaymentItem>(`/payments/${encodeURIComponent(id)}`, token, { signal });
}

export function recordPayment(token: string, input: RecordPaymentInput) {
  return apiRequest<PaymentItem>('/payments', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
