import type { PaymentItem, RecordPaymentInput } from './payment.types';
import { apiRequest } from '@/utils/api-client';

export interface PaymentsPage {
  items: PaymentItem[];
  hasMore: boolean;
  nextCursor: string | null;
}

export function fetchPayments(token: string, cursor?: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ limit: '50' });
  if (cursor) params.set('cursor', cursor);
  return apiRequest<PaymentsPage>(`/payments?${params}`, token, { signal });
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
