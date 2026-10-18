import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

import { useLocation } from '@/context/location-context';
import { mockTasks } from '@/data/mock-tasks';
import { fetchDriveTimes } from '@/lib/mapbox-matrix';
import { distanceKm } from '@/lib/stop-order';
import { withDistanceFrom } from '@/lib/task-distance';
import { Coordinates, Task } from '@/types/task';

// Drive times barely change over a few hundred metres, and every refresh is billed per
// task (one Matrix element each), so only re-ask after a real move.
const REFETCH_AFTER_KM = 1;

const TasksContext = createContext<Task[] | null>(null);

/**
 * The runs on offer, with `distanceKm` and `minutesToPickup` measured from the
 * volunteer's current position. Shared so Home and Nearby show the same numbers from
 * one Matrix request instead of one each.
 */
export function TasksProvider({ children }: { children: ReactNode }) {
  const { coords } = useLocation();
  // Seconds to each run's pickup, by task id. Runs with no road route are left out.
  const [secondsToPickup, setSecondsToPickup] = useState<Record<string, number>>({});
  const lastRequest = useRef<{ origin: Coordinates; tasksKey: string } | null>(null);

  // Swap for the backend's runs once they're wired up; the key re-asks when they change.
  const source = mockTasks;
  const tasksKey = source.map((task) => task.id).join(',');

  useEffect(() => {
    if (!coords) return;
    const last = lastRequest.current;
    if (last?.tasksKey === tasksKey && distanceKm(last.origin, coords) < REFETCH_AFTER_KM) {
      return;
    }

    const request = { origin: coords, tasksKey };
    lastRequest.current = request;
    // On failure the old times are kept and there's no retry until the next real move
    // (or task change) — retrying on every GPS fix would hammer a broken token.
    fetchDriveTimes(
      coords,
      source.map((task) => task.pickupCoords)
    )
      .then((times) => {
        if (!times || lastRequest.current !== request) return;
        setSecondsToPickup(
          Object.fromEntries(
            source.flatMap((task, i) => {
              const seconds = times[i];
              return seconds === null ? [] : [[task.id, seconds]];
            })
          )
        );
      })
      .catch(() => {});
    // `source` is identified by tasksKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, tasksKey]);

  const tasks = withDistanceFrom(source, coords).map((task) => {
    const seconds = secondsToPickup[task.id];
    return seconds === undefined
      ? task
      : { ...task, minutesToPickup: Math.max(1, Math.round(seconds / 60)) };
  });

  return <TasksContext.Provider value={tasks}>{children}</TasksContext.Provider>;
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
