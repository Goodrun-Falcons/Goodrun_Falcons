import { Coordinates } from '@/types/task';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
/** The Matrix API takes 25 coordinates per request for `driving`: the origin plus 24. */
const MAX_DESTINATIONS_PER_REQUEST = 24;

export function buildMatrixUrl(
  origin: Coordinates,
  destinations: Coordinates[],
  token: string
): string {
  const path = [origin, ...destinations].map((p) => `${p.lng},${p.lat}`).join(';');
  const destinationIndexes = destinations.map((_, i) => i + 1).join(';');
  return (
    `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${path}` +
    `?sources=0&destinations=${destinationIndexes}&annotations=duration&access_token=${token}`
  );
}

/**
 * Seconds from the origin to each destination, in order; null where there's no road
 * route. Null overall for an error body or one that doesn't match `count`.
 */
export function parseMatrixDurations(body: unknown, count: number): (number | null)[] | null {
  const { code, durations } = (body ?? {}) as { code?: string; durations?: (number | null)[][] };
  const row = durations?.[0];
  if (code !== 'Ok' || !Array.isArray(row) || row.length !== count) return null;
  return row;
}

/**
 * Driving time in seconds from `origin` to each of `destinations`. Billed per element
 * (one origin × one destination; free tier 100k/month), batched 24 destinations a request.
 * Null if any batch fails.
 */
export async function fetchDriveTimes(
  origin: Coordinates,
  destinations: Coordinates[]
): Promise<(number | null)[] | null> {
  if (!MAPBOX_TOKEN || destinations.length === 0) return null;
  const token = MAPBOX_TOKEN;

  const batches: Coordinates[][] = [];
  for (let i = 0; i < destinations.length; i += MAX_DESTINATIONS_PER_REQUEST) {
    batches.push(destinations.slice(i, i + MAX_DESTINATIONS_PER_REQUEST));
  }
  const results = await Promise.all(
    batches.map(async (batch) => {
      const response = await fetch(buildMatrixUrl(origin, batch, token));
      if (!response.ok) return null;
      return parseMatrixDurations(await response.json(), batch.length);
    })
  );
  return results.some((r) => r === null) ? null : results.flatMap((r) => r ?? []);
}
