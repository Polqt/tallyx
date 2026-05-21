import type {
  CreateCustomerInput,
  CustomerDetail,
  CustomerListItem,
  CustomerListResponse,
  FetchCustomersParams,
  UpdateCustomerInput,
} from './customer.types';
import { apiRequest } from '@/utils/api-client';
import { cacheCustomers, getCachedCustomers } from '@/lib/cache/customers.cache';

function buildCustomerListPath(params: FetchCustomersParams) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  const query = params.query?.trim();
  if (query) searchParams.set('q', query);
  return `/customers?${searchParams.toString()}`;
}

export async function fetchCustomers(
  token: string,
  params: FetchCustomersParams = {}
): Promise<CustomerListResponse> {
  try {
    const data = await apiRequest<CustomerListResponse>(buildCustomerListPath(params), token, {
      signal: params.signal,
    });
    cacheCustomers(data.items).catch(() => {});
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    const cached = await getCachedCustomers(params.query);
    return {
      items: cached,
      pagination: { page: 1, limit: cached.length, total: cached.length, totalPages: 1, hasMore: false },
    };
  }
}

export async function fetchCustomerDetail(
  token: string,
  id: string,
  signal?: AbortSignal
): Promise<CustomerDetail> {
  return apiRequest<CustomerDetail>(`/customers/${encodeURIComponent(id)}`, token, { signal });
}

export function createCustomer(token: string, input: CreateCustomerInput) {
  return apiRequest<CustomerListItem>('/customers', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateCustomer(token: string, id: string, input: UpdateCustomerInput) {
  return apiRequest<CustomerListItem>(`/customers/${encodeURIComponent(id)}`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCustomer(token: string, id: string) {
  return apiRequest<void>(`/customers/${encodeURIComponent(id)}`, token, { method: 'DELETE' });
}
