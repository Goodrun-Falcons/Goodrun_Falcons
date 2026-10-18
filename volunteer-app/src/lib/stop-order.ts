import { Coordinates } from '@/types/task';
import { TripStop } from '@/types/trip';

const EARTH_RADIUS_KM = 6371;

/** Straight-line (haversine) distance between two points, in km. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** A run's drop-off must never come before its own pickup. */
export function isValidOrder(stops: TripStop[]): boolean {
  return stops.every((stop, index) => {
    if (stop.type !== 'dropoff') return true;
    const pickupIndex = stops.findIndex((s) => s.taskId === stop.taskId && s.type === 'pickup');
    return pickupIndex === -1 || pickupIndex < index;
  });
}

/**
 * How many runs a volunteer can carry in one trip. It's also what keeps the exhaustive
 * search in recommendStopOrder cheap: 2 runs is 4 stops, which has only 6 valid orders.
 * (The count grows fast — 4 runs would be 2,520 orders, 6 runs over 7 million.)
 */
export const MAX_RUNS_PER_TRIP = 2;

/** Every order of `stops` in which each drop-off comes after its own pickup. */
function validOrders(stops: TripStop[]): TripStop[][] {
  if (stops.length === 0) return [[]];
  return stops.flatMap((first) => {
    const pickupStillWaiting =
      first.type === 'dropoff' &&
      stops.some((s) => s.taskId === first.taskId && s.type === 'pickup');
    if (pickupStillWaiting) return [];
    const rest = stops.filter((stop) => stop !== first);
    return validOrders(rest).map((tail) => [first, ...tail]);
  });
}

function routeLengthKm(stops: TripStop[], from?: Coordinates): number {
  const path = [...(from ? [from] : []), ...stops.map((stop) => stop.coords)];
  return path.slice(1).reduce((sum, point, i) => sum + distanceKm(path[i], point), 0);
}

/**
 * Suggested order: the shortest (straight-line) route through every unfinished stop,
 * found by trying each valid order. It starts from `start` (the volunteer's position),
 * else from the last finished stop, else wherever is best. Finished stops stay at the
 * front. Meant for at most MAX_RUNS_PER_TRIP runs — see there for why.
 */
export function recommendStopOrder(stops: TripStop[], start?: Coordinates): TripStop[] {
  const done = stops.filter((stop) => stop.done);
  // Sorted so equal-length routes (e.g. two drop-offs at the same warehouse) resolve the
  // same way whatever order the stops arrive in.
  const remaining = stops
    .filter((stop) => !stop.done)
    .sort(
      (a, b) =>
        a.taskId.localeCompare(b.taskId) || (a.type === b.type ? 0 : a.type === 'pickup' ? -1 : 1)
    );
  const from = start ?? done[done.length - 1]?.coords;

  let best = remaining;
  let bestLength = Infinity;
  for (const order of validOrders(remaining)) {
    const length = routeLengthKm(order, from);
    if (length < bestLength) {
      best = order;
      bestLength = length;
    }
  }
  return [...done, ...best];
}

/**
 * Moves the stop at `from` to index `to`. Returns null when that isn't allowed: finished
 * stops stay put at the front, and a drop-off can't end up before its own pickup.
 */
export function reorderStops(stops: TripStop[], from: number, to: number): TripStop[] | null {
  if (from === to || from < 0 || to < 0 || from >= stops.length || to >= stops.length) return null;

  const next = [...stops];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);

  const doneCount = stops.filter((stop) => stop.done).length;
  const doneKept = stops.slice(0, doneCount).every((stop, i) => next[i] === stop);

  return doneKept && isValidOrder(next) ? next : null;
}
