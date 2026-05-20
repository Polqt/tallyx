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
  console.log(`[Payment API Request] Init: ${options.method ?? 'GET'} ${targetUrl}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token ? `${token.slice(0, 10)}...` : 'none'}`,
      ...options.headers,
    },
    body: options.body
  });

  try {
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
      console.error(`[Payment API Request Error] Response status ${response.status} for ${targetUrl}:`, data);
      throw new Error(data.error ?? data.message ?? `Payment request failed with status ${response.status}`);
    }

    console.log(`[Payment API Request Success] Loaded payload for ${targetUrl}`);
    return data as T;
  } catch (err) {
    console.error(`[Payment API Request Error] Failed for ${targetUrl}:`, err);
    throw err;
  }
}

export function fetchPayments(token: string, signal?: AbortSignal) {
  return paymentRequest<PaymentItem[]>('/payments', token, { signal });
}

export function fetchPayment(token: string, id: string, signal?: AbortSignal) {
  return paymentRequest<PaymentItem>(`/payments/${id}`, token, { signal });
}

export function recordPayment(token: string, input: RecordPaymentInput) {
  return paymentRequest<PaymentItem>('/payments', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
