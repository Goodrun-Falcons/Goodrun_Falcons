import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

import { useLocation } from '@/context/location-context';
import { useTrip } from '@/context/trip-context';
import { api, ApiError } from '@/lib/api';
import { fetchDriveTimes } from '@/lib/mapbox-matrix';
import { requestToTask } from '@/lib/mappers';
import { routeToResume } from '@/lib/trip-sync';
import { distanceKm } from '@/lib/stop-order';
import { withDistanceFrom } from '@/lib/task-distance';
import { Coordinates, Task } from '@/types/task';

// Drive times barely change over a few hundred metres, and every refresh is billed per
// task (one Matrix element each), so only re-ask after a real move.
const REFETCH_AFTER_KM = 1;

type TasksContextValue = {
  /** Open runs (GET /requests), with distance and drive time from the volunteer. */
  tasks: Task[];
  /** True until the first load finishes, successfully or not. */
  loading: boolean;
  /** True while a reload is in flight after the first load. */
  refreshing: boolean;
  /** Message for the last failed load, or null. The previous list is kept on failure. */
  error: string | null;
  /**
   * Fetches the list again. `manual` (the default, e.g. pull-to-refresh) shows the
   * spinner and reports failures; `background` (e.g. a timer) does neither, so a
   * periodic refresh is invisible unless the list actually changes.
   */
  reload: (mode?: ReloadMode) => Promise<void>;
};

type ReloadMode = 'manual' | 'background';

const TasksContext = createContext<TasksContextValue | null>(null);

function loadErrorMessage(error: unknown) {
  // Status 0 is apiFetch's own network-failure message, already written for people.
  if (error instanceof ApiError && error.status === 0) return error.message;
  return "Couldn't load runs. Pull down to try again.";
}

/**
 * The runs on offer, with `distanceKm` and `minutesToPickup` measured from the
 * volunteer's current position. Shared so Home and Nearby show the same list and the
 * same numbers from one request each, rather than one per screen.
 */
export function TasksProvider({ children }: { children: ReactNode }) {
  const { coords } = useLocation();
  const { syncAccepted, resumeRoute } = useTrip();
  const [source, setSource] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Seconds to each run's pickup, by task id. Runs with no road route are left out.
  const [secondsToPickup, setSecondsToPickup] = useState<Record<string, number>>({});
  const lastDriveTimes = useRef<{ origin: Coordinates; tasksKey: string } | null>(null);
  // Skips a refresh that would overlap one still running (e.g. a timer tick during a
  // slow cold start on the backend).
  const inFlight = useRef(false);

  function load(mode: ReloadMode | 'initial') {
    if (inFlight.current) return Promise.resolve();
    inFlight.current = true;
    // The volunteer's own accepted runs ride along with every list load, keeping My Route
    // in step with the backend (and bringing it back after a restart). Its failure is
    // logged by apiFetch and otherwise ignored — it shouldn't stop the open runs loading.
    const requestedAt = Date.now();
    api
      .getAcceptedRequests()
      .then((accepted) => syncAccepted(accepted.map(requestToTask), requestedAt))
      // Then any route already under way (e.g. the app restarted mid-trip). After the sync
      // above, so the stops it reorders are already there.
      .then(() => api.getMyRoutes())
      .then(async (routes) => {
        const route = routeToResume(routes);
        if (!route) return;
        const status = route.status as 'planned' | 'active';
        const order =
          status === 'active'
            ? (await api.getRoute(route.id)).route_stops.flatMap((stop) =>
                stop.pickups ? [{ pickupId: stop.pickups.id, type: stop.stop_type }] : []
              )
            : [];
        resumeRoute(route.id, status, order);
      })
      .catch(() => {});
    return api
      .getRequests()
      .then((requests) => {
        setSource(requests.map(requestToTask));
        setError(null);
      })
      .catch((e: unknown) => {
        // A failed background refresh keeps the current list and stays quiet.
        if (mode !== 'background') setError(loadErrorMessage(e));
      })
      .finally(() => {
        inFlight.current = false;
        setLoading(false);
        setRefreshing(false);
      });
  }

  function reload(mode: ReloadMode = 'manual') {
    if (mode === 'manual' && !inFlight.current) setRefreshing(true);
    return load(mode);
  }

  // First load when the signed-in screens mount (this provider lives in their layout,
  // so there's always a token by now).
  useEffect(() => {
    load('initial');
    // Once per mount; later loads come from reload().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-ask for drive times when the volunteer moves or the set of runs changes.
  const tasksKey = source.map((task) => task.id).join(',');
  useEffect(() => {
    if (!coords || source.length === 0) return;
    const last = lastDriveTimes.current;
    if (last?.tasksKey === tasksKey && distanceKm(last.origin, coords) < REFETCH_AFTER_KM) {
      return;
    }

    const request = { origin: coords, tasksKey };
    lastDriveTimes.current = request;
    // On failure the old times are kept and there's no retry until the next real move
    // (or task change) — retrying on every GPS fix would hammer a broken token.
    fetchDriveTimes(
      coords,
      source.map((task) => task.pickupCoords)
    )
      .then((times) => {
        if (!times || lastDriveTimes.current !== request) return;
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

  return (
    <TasksContext.Provider value={{ tasks, loading, refreshing, error, reload }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
