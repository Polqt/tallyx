import type {
  CreateCreditInput,
  CreditListItem,
  CreditListResponse,
  FetchCreditsParams,
} from './credit.types';

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

async function creditRequest<T>(path: string, token: string, options: RequestInit = {}) {
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
    throw new Error(data.error ?? data.message ?? 'Credit request failed.');
  }

  return data as T;
}

function buildCreditListPath(params: FetchCreditsParams) {
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  if (params.customerId) searchParams.set('customerId', params.customerId);
  if (params.status) searchParams.set('status', params.status);
  return `/credits?${searchParams.toString()}`;
}

export function fetchCredits(token: string, params: FetchCreditsParams = {}) {
  return creditRequest<CreditListResponse>(buildCreditListPath(params), token, {
    signal: params.signal,
  });
}

export function fetchCredit(token: string, id: string, signal?: AbortSignal) {
  return creditRequest<CreditListItem>(`/credits/${id}`, token, { signal });
}

export function createCredit(token: string, input: CreateCreditInput) {
  return creditRequest<CreditListItem>('/credits', token, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function voidCredit(token: string, id: string) {
  return creditRequest<CreditListItem>(`/credits/${id}/void`, token, { method: 'PATCH' });
}
