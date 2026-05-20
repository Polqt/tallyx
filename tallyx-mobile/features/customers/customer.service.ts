import type {
  CreateCustomerInput,
  CustomerDetail,
  CustomerListItem,
  CustomerListResponse,
  FetchCustomersParams,
  UpdateCustomerInput,
} from './customer.types';
import { apiRequest } from '@/utils/api-client';

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
  return apiRequest<CustomerListResponse>(buildCustomerListPath(params), token, {
    signal: params.signal,
  });
}

export function fetchCustomerDetail(token: string, id: string, signal?: AbortSignal) {
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
