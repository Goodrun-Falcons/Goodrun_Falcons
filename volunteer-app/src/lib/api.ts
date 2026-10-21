import { router } from 'expo-router';
import { File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

import {
  ApiPickup,
  ApiRequest,
  ApiRoute,
  ApiRouteStopInput,
  ApiRouteWithStops,
  ApiVolunteer,
  ApiVolunteerStats,
} from '@/types/api';

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

// The camera and picker hand back JPEGs (quality < 1 re-encodes, including HEIC), but go
// by the extension in case a PNG / WebP comes through.
function photoExtension(uri: string): 'jpg' | 'png' | 'webp' {
  const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
  return ext === 'png' || ext === 'webp' ? ext : 'jpg';
}

function photoMimeType(uri: string): string {
  const ext = photoExtension(uri);
  return ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
}

/**
 * Turns an error response into an ApiError. Bodies vary by endpoint: `error` and `message`
 * may each be a string, Supabase's error object ({ code, message, details }), or missing.
 * Keeps whatever text there is rather than ending up with "[object Object]".
 */
export function apiErrorFromBody(status: number, data: unknown): ApiError {
  const body = (data && typeof data === 'object' ? data : {}) as {
    error?: unknown;
    message?: unknown;
  };
  const asDbError = (v: unknown) =>
    v && typeof v === 'object' ? (v as { code?: unknown; message?: unknown }) : null;
  const dbError = asDbError(body.error) ?? asDbError(body.message);
  const code =
    typeof body.error === 'string'
      ? body.error
      : typeof dbError?.code === 'string'
        ? dbError.code
        : 'UNKNOWN_ERROR';
  const message =
    (typeof dbError?.message === 'string' && dbError.message) ||
    (typeof body.message === 'string' && body.message) ||
    code;
  return new ApiError(status, code, message);
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

async function apiFetch<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: unknown
): Promise<T> {
  const token = await getAccessToken();

  // FormData goes as-is: fetch sets the multipart Content-Type (with its boundary) itself.
  const isForm = body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      // JSON Content-Type only with a JSON body: the backend (Fastify) rejects a request
      // that declares JSON but has an empty body with a 400.
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body === undefined || isForm ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (e) {
    // No response at all (offline, timed out, or the upload itself couldn't be sent).
    if (__DEV__) console.log(`[api] ${method} ${path} → network error`, String(e));
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

  throw apiErrorFromBody(response.status, data);
}

// Endpoints as in the "GoodRun API" doc. Delivery requests used to be `/items`; the
// backend renamed them to `/requests` with the new schema.
export const api = {
  getMe: () => apiFetch<ApiVolunteer>('/volunteers/me'),
  getMyStats: () => apiFetch<ApiVolunteerStats>('/volunteers/statistics'),
  /** Requests still open for a volunteer to take (status `approved`, i.e. vetted by an admin). */
  getRequests: () => apiFetch<ApiRequest[]>('/requests'),
  /** Fails with 409 once the request is no longer `approved` (e.g. someone else took it). */
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
  /** Pickup lifecycle: assigned → en_route (start) → picked_up (picked) → delivered (end). */
  startPickup: (pickupId: string) =>
    apiFetch<{ message: string }>(`/pickups/${pickupId}/start`, 'POST'),
  /** Goods collected — on to the drop-off. */
  pickedPickup: (pickupId: string) =>
    apiFetch<{ message: string }>(`/pickups/${pickupId}/picked`, 'POST'),
  /**
   * Stores the proof-of-delivery photo on the pickup (one per pickup — a second upload
   * replaces the first). JPEG / PNG / WebP up to 5 MB; doesn't change any status.
   */
  uploadHandoverPhoto: (pickupId: string, photoUri: string) => {
    const form = new FormData();
    // Expo's fetch (the global one in this SDK) doesn't accept React Native's
    // { uri, name, type } file parts — only strings, Blobs, or objects with bytes(). So
    // read the file through expo-file-system and hand over its bytes, with the MIME type
    // set explicitly (the backend rejects anything not JPEG / PNG / WebP). The field must
    // be called "photo".
    const file = new File(photoUri);
    form.append('photo', {
      name: `handover.${photoExtension(photoUri)}`,
      type: photoMimeType(photoUri),
      bytes: () => file.bytes(),
    } as unknown as Blob);
    return apiFetch<{ message?: string }>(`/pickups/${pickupId}/handover-photo`, 'POST', form);
  },
  /** Delivered: also marks the request delivered. */
  endPickup: (pickupId: string) =>
    apiFetch<{ message: string }>(`/pickups/${pickupId}/end`, 'POST'),
  getRoute: (routeId: string) => apiFetch<ApiRouteWithStops>(`/routes/${routeId}`),
  /**
   * The volunteer's route (GET /routes): one route or null today. Normalised to a list so
   * callers cope if the backend starts returning all of them.
   */
  getMyRoutes: () =>
    apiFetch<ApiRoute | ApiRoute[] | null>('/routes').then((r) => (r ? [r].flat() : [])),
  /**
   * Replaces the route's stops with `stops`, in order: missing ones are created, moved
   * ones renumbered, ones left out deleted. Each pickup needs both its pickup and drop-off.
   */
  setRouteStops: (routeId: string, stops: ApiRouteStopInput[]) =>
    apiFetch<{ message: string; route_id: string; stop_count: number }>(
      `/routes/${routeId}/stops`,
      'PUT',
      { stops }
    ),
};
