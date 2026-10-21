import { ApiRouteStopInput } from '@/types/api';
import { Task } from '@/types/task';
import { TripStop } from '@/types/trip';

/**
 * What it takes to make the trip match the runs the backend says this volunteer holds
 * (GET /accepted-requests, requested at `requestedAt`):
 * - `missing`: held runs the trip doesn't show yet (e.g. after a restart).
 * - `gone`: runs the trip shows but the backend no longer has as theirs. Kept anyway once
 *   the trip has started or the run's pickup is done (mid-delivery the backend may have
 *   moved it past `accepted`), and when accepted after `requestedAt` — that response
 *   couldn't know about it yet.
 */
export function planTripSync(
  stops: TripStop[],
  held: Task[],
  options: {
    tripStarted: boolean;
    requestedAt: number;
    /** When each run was accepted in this session; runs not in it count as older. */
    acceptedAt: ReadonlyMap<string, number>;
  }
): { missing: Task[]; gone: Set<string> } {
  const heldIds = new Set(held.map((task) => task.id));
  const missing = held.filter((task) => !stops.some((stop) => stop.taskId === task.id));
  if (options.tripStarted) return { missing, gone: new Set() };

  const gone = new Set(
    stops
      .map((stop) => stop.taskId)
      .filter(
        (taskId) =>
          !heldIds.has(taskId) &&
          !stops.some((stop) => stop.taskId === taskId && stop.done) &&
          (options.acceptedAt.get(taskId) ?? 0) < options.requestedAt
      )
  );
  return { missing, gone };
}

/**
 * The trip's stops, in their current order, as the body of PUT /routes/:routeId/stops.
 * Null when it can't be sent as-is: a stop without a pickup id (not synced yet), or a run
 * missing its drop-off — the backend requires both stops for every pickup.
 */
export function routeStopsPayload(stops: TripStop[]): ApiRouteStopInput[] | null {
  if (stops.some((stop) => !stop.pickupId)) return null;
  const hasBoth = stops.every((stop) =>
    stops.some((other) => other.taskId === stop.taskId && other.type !== stop.type)
  );
  if (!hasBoth) return null;
  return stops.map((stop, i) => ({
    pickup_id: stop.pickupId!,
    stop_type: stop.type,
    sequence_number: i + 1,
  }));
}

/** The route a restarted app should pick back up: the newest active one, else planned. */
export function routeToResume<T extends { status: string; created_at: string }>(
  routes: T[]
): T | null {
  const newestFirst = [...routes].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    newestFirst.find((route) => route.status === 'active') ??
    newestFirst.find((route) => route.status === 'planned') ??
    null
  );
}

/**
 * The trip's stops in the order the backend route has them (matched by pickup id and stop
 * type). Stops the route doesn't mention keep their place after the ones it does.
 */
export function orderLikeRoute(
  stops: TripStop[],
  routeOrder: { pickupId: string; type: TripStop['type'] }[]
): TripStop[] {
  const rank = new Map(routeOrder.map((s, i) => [`${s.pickupId}:${s.type}`, i]));
  const rankOf = (stop: TripStop) => rank.get(`${stop.pickupId}:${stop.type}`) ?? Infinity;
  return stops
    .map((stop, i) => ({ stop, i }))
    .sort((a, b) => rankOf(a.stop) - rankOf(b.stop) || a.i - b.i)
    .map(({ stop }) => stop);
}
