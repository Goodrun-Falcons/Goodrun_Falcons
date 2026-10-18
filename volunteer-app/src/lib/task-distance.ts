import { distanceKm } from '@/lib/stop-order';
import { Coordinates, Task } from '@/types/task';

/**
 * Straight-line distance from the volunteer to each run's pickup. Until there's a
 * location fix, runs keep whatever distance they came with.
 */
export function withDistanceFrom(tasks: Task[], from: Coordinates | null): Task[] {
  if (!from) return tasks;
  return tasks.map((task) => ({ ...task, distanceKm: distanceKm(from, task.pickupCoords) }));
}
