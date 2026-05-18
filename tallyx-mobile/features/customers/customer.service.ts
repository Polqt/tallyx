import type { CreateCustomerInput, CustomerDetail, CustomerListItem } from './customer.types';

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

async function customerRequest<T>(path: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.error ?? data.message ?? 'Customer request failed.');
  }

  return data as T;
}

export function fetchCustomers(token: string, signal?: AbortSignal) {
  return customerRequest<CustomerListItem[]>('/customers', token, { signal });
}

export function fetchCustomerDetail(token: string, id: string, signal?: AbortSignal) {
  return customerRequest<CustomerDetail>(`/customers/${id}`, token, { signal });
}

export function createCustomer(token: string, input: CreateCustomerInput) {
  return customerRequest<CustomerListItem>('/customers', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
