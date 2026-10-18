import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

import { ApiItem, ApiPickup, ApiRoute, ApiRouteWithStops } from '@/types/api';

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
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to connect to the server. Please try again.');
  }

  const data = await response.json().catch(() => null);

  if (response.ok) return data as T;

  // There is no refresh endpoint yet, so an expired or missing token means signing in again.
  if (response.status === 401) {
    await clearSession();
    router.replace('/login');
  }

  const code = typeof data?.error === 'string' ? data.error : 'UNKNOWN_ERROR';
  throw new ApiError(response.status, code, data?.message ?? code);
}

export const api = {
  getItems: () => apiFetch<ApiItem[]>('/items'),
  acceptItem: (itemId: string) => apiFetch<ApiPickup>(`/items/${itemId}/accept`, 'POST'),
  cancelItem: (itemId: string) => apiFetch<ApiItem>(`/items/${itemId}/cancel`, 'POST'),
  createRoute: () => apiFetch<ApiRoute>('/routes', 'POST'),
  startRoute: (routeId: string) => apiFetch<ApiRoute>(`/routes/${routeId}/start`, 'POST'),
  endRoute: (routeId: string) =>
    apiFetch<{ message: string; route: ApiRoute }>(`/routes/${routeId}/end`, 'POST'),
  getRoute: (routeId: string) => apiFetch<ApiRouteWithStops>(`/routes/${routeId}`),
};
