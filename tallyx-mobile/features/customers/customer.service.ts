import type {
  CreateCustomerInput,
  CustomerDetail,
  CustomerListItem,
  CustomerListResponse,
  FetchCustomersParams,
  UpdateCustomerInput,
} from './customer.types';

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

function buildCustomerListPath(params: FetchCustomersParams) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  const query = params.query?.trim();
  if (query) searchParams.set('q', query);

  return `/customers?${searchParams.toString()}`;
}

export function fetchCustomers(token: string, params: FetchCustomersParams = {}) {
  return customerRequest<CustomerListResponse>(buildCustomerListPath(params), token, {
    signal: params.signal,
  });
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

export function updateCustomer(token: string, id: string, input: UpdateCustomerInput) {
  return customerRequest<CustomerListItem>(`/customers/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCustomer(token: string, id: string) {
  return customerRequest<void>(`/customers/${id}`, token, { method: 'DELETE' });
}
