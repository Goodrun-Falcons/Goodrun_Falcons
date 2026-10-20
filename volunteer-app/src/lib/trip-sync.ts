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
