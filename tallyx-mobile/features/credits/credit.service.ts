import type {
  CreateCreditInput,
  CreditListItem,
  CreditListResponse,
  FetchCreditsParams,
} from './credit.types';
import { apiRequest } from '@/utils/api-client';
import { cacheCredits, getCachedCredits } from '@/lib/cache/credits.cache';

function buildCreditListPath(params: FetchCreditsParams) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  if (params.customerId) searchParams.set('customerId', params.customerId);
  if (params.status) searchParams.set('status', params.status);
  return `/credits?${searchParams.toString()}`;
}

export async function fetchCredits(
  token: string,
  params: FetchCreditsParams = {}
): Promise<CreditListResponse> {
  try {
    const data = await apiRequest<CreditListResponse>(buildCreditListPath(params), token, {
      signal: params.signal,
    });
    cacheCredits(data.items).catch(() => {});
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    const isNetworkFailure =
      err instanceof TypeError ||
      (err instanceof Error && /timed out|network|failed to fetch/i.test(err.message));
    if (!isNetworkFailure) throw err;
    const cached = await getCachedCredits({
      customerId: params.customerId,
      status: params.status,
    });
    return {
      items: cached,
      pagination: { page: 1, limit: cached.length, total: cached.length, totalPages: 1, hasMore: false },
    };
  }
}

export function fetchCredit(token: string, id: string, signal?: AbortSignal) {
  return apiRequest<CreditListItem>(`/credits/${encodeURIComponent(id)}`, token, { signal });
}

export function createCredit(token: string, input: CreateCreditInput) {
  return apiRequest<CreditListItem>('/credits', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function voidCredit(token: string, id: string) {
  return apiRequest<CreditListItem>(`/credits/${encodeURIComponent(id)}/void`, token, { method: 'PATCH' });
}

export function unvoidCredit(token: string, id: string) {
  return apiRequest<CreditListItem>(`/credits/${encodeURIComponent(id)}/unvoid`, token, { method: 'PATCH' });
}

export function updateCredit(token: string, id: string, input: { note?: string | null; dueDate?: string | null }) {
  return apiRequest<CreditListItem>(`/credits/${encodeURIComponent(id)}`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteCredit(token: string, id: string) {
  return apiRequest<{ id: string }>(`/credits/${encodeURIComponent(id)}`, token, { method: 'DELETE' });
}
