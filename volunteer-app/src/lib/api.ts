import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { ApiPickup, ApiRequest, ApiRoute, ApiRouteWithStops } from '@/types/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://goodrun-backend.onrender.com';

export class ApiError extends Error {
  constructor(
    public status: number,
    /** The backend's `error` field: sometimes a code (ROUTE_HAS_UNCOMPLETED_STOPS), sometimes a sentence. */
    public code: string,
    message: string
  ) {
    super(message);
  }
}

/** A sentence for an alert, so a server fault isn't passed off as a connection problem. */
export function describeApiError(error: unknown): string {
  let text = 'Please try again.';
  if (error instanceof ApiError && error.status === 0) text = error.message;
  else if (error instanceof ApiError && error.status >= 500) {
    text = 'Something went wrong on our side. Please try again later.';
  }
  // In development, show what the backend actually said — "500" alone can mean several
  // different failures inside one endpoint.
  if (__DEV__ && error instanceof ApiError && error.status !== 0) {
    text += `\n\n[dev] ${error.status}: ${error.message}`;
  }
  return text;
}

async function getAccessToken() {
  try {
    return await SecureStore.getItemAsync('accessToken');
  } catch {
    return null;
  }
}

async function clearSession() {
  try {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
  } catch {
    // Nothing to clear if secure storage isn't available.
  }
}

async function apiFetch<T>(path: string, method: 'GET' | 'POST' = 'GET'): Promise<T> {
  const token = await getAccessToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      // No Content-Type: none of these calls send a body, and the backend (Fastify)
      // rejects a POST that declares JSON but has an empty body with a 400.
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to connect to the server. Please try again.');
  }

  const data = await response.json().catch(() => null);

  if (response.ok) return data as T;

  // Shows up in the Metro terminal while developing; screens only show a short alert.
  if (__DEV__) {
    console.log(`[api] ${method} ${path} → ${response.status}`, JSON.stringify(data));
  }

  // There is no refresh endpoint yet, so an expired or missing token means signing in again.
  if (response.status === 401) {
    await clearSession();
    router.replace('/login');
  }

  // `error` is usually a string, but some endpoints pass Supabase's error object straight
  // through ({ code, message, details }); keep its text rather than losing it.
  const raw = data?.error;
  const code =
    typeof raw === 'string' ? raw : typeof raw?.code === 'string' ? raw.code : 'UNKNOWN_ERROR';
  const detail = typeof raw === 'object' && raw ? (raw.message ?? raw.details) : undefined;
  throw new ApiError(response.status, code, detail ?? data?.message ?? code);
}

// Endpoints as in the "GoodRun API" doc. Delivery requests used to be `/items`; the
// backend renamed them to `/requests` with the new schema.
export const api = {
  /** Requests still open for a volunteer to take (status `pending`). */
  getRequests: () => apiFetch<ApiRequest[]>('/requests'),
  /** Fails with 409 once the request is no longer pending (e.g. someone else took it). */
  acceptRequest: (requestId: string) =>
    apiFetch<ApiPickup>(`/requests/${requestId}/accept`, 'POST'),
  /**
   * Requests this volunteer has accepted and not yet started (status `accepted`).
   * Only covers accepts made since the backend began recording `requests.volunteer_id`.
   */
  getAcceptedRequests: () => apiFetch<ApiRequest[]>('/accepted-requests'),
  cancelRequest: (requestId: string) =>
    apiFetch<ApiRequest>(`/requests/${requestId}/cancel`, 'POST'),
  createRoute: () => apiFetch<ApiRoute>('/routes', 'POST'),
  startRoute: (routeId: string) => apiFetch<ApiRoute>(`/routes/${routeId}/start`, 'POST'),
  endRoute: (routeId: string) =>
    apiFetch<{ message: string; route: ApiRoute }>(`/routes/${routeId}/end`, 'POST'),
  getRoute: (routeId: string) => apiFetch<ApiRouteWithStops>(`/routes/${routeId}`),
};
