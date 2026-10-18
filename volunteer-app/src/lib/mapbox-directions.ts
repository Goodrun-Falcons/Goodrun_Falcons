import { Coordinates } from '@/types/task';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
/** The Directions API's limit for the `driving` profile. */
export const MAX_ROUTE_POINTS = 25;

export type RouteLeg = { distanceM: number; durationS: number };

export type DrivingRoute = {
  /** [lng, lat] pairs along the roads, ready for a GeoJSON LineString. */
  geometry: [number, number][];
  distanceM: number;
  durationS: number;
  /** One per hop between consecutive points: legs[0] is points[0] → points[1]. */
  legs: RouteLeg[];
};

export function buildDirectionsUrl(points: Coordinates[], token: string): string {
  const path = points.map((p) => `${p.lng},${p.lat}`).join(';');
  return (
    `https://api.mapbox.com/directions/v5/mapbox/driving/${path}` +
    `?geometries=geojson&overview=full&access_token=${token}`
  );
}

/** Null for anything other than a usable route (no route found, error body, etc.). */
export function parseDirectionsResponse(body: unknown): DrivingRoute | null {
  const route = (body as { code?: string; routes?: unknown[] })?.routes?.[0] as
    | {
        geometry?: { coordinates?: [number, number][] };
        distance?: number;
        duration?: number;
        legs?: { distance: number; duration: number }[];
      }
    | undefined;
  if ((body as { code?: string })?.code !== 'Ok' || !route?.geometry?.coordinates) return null;

  return {
    geometry: route.geometry.coordinates,
    distanceM: route.distance ?? 0,
    durationS: route.duration ?? 0,
    legs: (route.legs ?? []).map((leg) => ({ distanceM: leg.distance, durationS: leg.duration })),
  };
}

/**
 * Driving route through `points` in order. Each call is one Directions API request
 * (free tier: 100k/month), so callers should only ask when the route actually changes.
 */
export async function fetchDrivingRoute(points: Coordinates[]): Promise<DrivingRoute | null> {
  if (!MAPBOX_TOKEN || points.length < 2) return null;
  const response = await fetch(buildDirectionsUrl(points.slice(0, MAX_ROUTE_POINTS), MAPBOX_TOKEN));
  if (!response.ok) return null;
  return parseDirectionsResponse(await response.json());
}
