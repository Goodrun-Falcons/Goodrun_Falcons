import { distanceKm } from '@/lib/stop-order';
import { Coordinates } from '@/types/task';
import { TripStop } from '@/types/trip';

// Mid-trip the GPS fires every few metres; the backend (and anyone watching the map)
// only needs a fresh fix this often.
export const REPORT_AFTER_M = 50;
export const REPORT_AFTER_MS = 30_000;

/** Whether a new fix is worth sending, given the last one that was. */
export function shouldReportLocation(
  last: { coords: Coordinates; at: number } | null,
  coords: Coordinates,
  now: number
): boolean {
  if (!last) return true;
  return (
    distanceKm(last.coords, coords) * 1000 >= REPORT_AFTER_M || now - last.at >= REPORT_AFTER_MS
  );
}

/** Pickups whose run is still under way (not yet delivered) — the ones to report against. */
export function pickupsToTrack(stops: TripStop[]): string[] {
  const delivered = new Set(
    stops.filter((stop) => stop.type === 'dropoff' && stop.done).map((stop) => stop.taskId)
  );
  return [
    ...new Set(
      stops.flatMap((stop) => (stop.pickupId && !delivered.has(stop.taskId) ? [stop.pickupId] : []))
    ),
  ];
}
