import type { PaymentItem, RecordPaymentInput } from './payment.types';
import { apiRequest } from '@/utils/api-client';

export function fetchPayments(token: string, signal?: AbortSignal) {
  return apiRequest<PaymentItem[]>('/payments', token, { signal });
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
