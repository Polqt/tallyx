import type { PaymentItem, RecordPaymentInput } from './payment.types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function paymentRequest<T>(path: string, token: string, options: RequestInit = {}) {
  const targetUrl = `${API_URL}${path}`;

  const response = await fetch(targetUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? `Payment request failed with status ${response.status}`);
  }

  return data as T;
}

export function fetchPayments(token: string, signal?: AbortSignal) {
  return paymentRequest<PaymentItem[]>('/payments', token, { signal });
}

export function fetchPayment(token: string, id: string, signal?: AbortSignal) {
  return paymentRequest<PaymentItem>(`/payments/${encodeURIComponent(id)}`, token, { signal });
}

export function recordPayment(token: string, input: RecordPaymentInput) {
  return paymentRequest<PaymentItem>('/payments', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
