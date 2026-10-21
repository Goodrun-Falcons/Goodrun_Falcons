import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

import { useLocation } from '@/context/location-context';
import { MAX_RUNS_PER_TRIP, recommendStopOrder, reorderStops } from '@/lib/stop-order';
import { orderLikeRoute, planTripSync } from '@/lib/trip-sync';
import { Task } from '@/types/task';
import { TripStop } from '@/types/trip';

export type TripStatus = 'ready' | 'active';

function taskToStops(task: Task): TripStop[] {
  const pickup: TripStop = {
    id: `${task.id}:pickup`,
    taskId: task.id,
    pickupId: task.pickupId,
    org: task.orgName,
    address: task.pickupAddress,
    itemType: task.itemType,
    item: task.itemSummary,
    type: 'pickup',
    coords: task.pickupCoords,
    done: false,
  };
  if (!task.dropoffCoords) return [pickup];

  return [
    pickup,
    {
      ...pickup,
      id: `${task.id}:dropoff`,
      address: task.dropoffAddress,
      type: 'dropoff',
      coords: task.dropoffCoords,
    },
  ];
}

type TripContextValue = {
  stops: TripStop[];
  tripStatus: TripStatus;
  /**
   * The backend route for this trip (POST /routes). Set as soon as it's created, so a
   * start that fails half-way reuses it on retry instead of creating another.
   */
  routeId: string | null;
  setRouteId: (routeId: string | null) => void;
  /** Local only — the screen calls POST /routes/:id/start first. */
  startTrip: () => void;
  /** Local only — the screen calls POST /routes/:id/end first. Clears routeId. */
  endTrip: () => void;
  /**
   * Picks up a route the backend says this volunteer already has (GET /routes), e.g.
   * after a restart: remembers its id, and if it's active resumes the trip with the stops
   * in the route's order. Ignored when this session already has a route of its own.
   */
  resumeRoute: (
    routeId: string,
    status: 'planned' | 'active',
    order: { pickupId: string; type: TripStop['type'] }[]
  ) => void;
  acceptTask: (task: Task) => void;
  /**
   * Makes the trip match the runs the backend says this volunteer holds
   * (GET /accepted-requests, fetched starting at `requestedAt`):
   * - adds ones the trip is missing — e.g. after a restart, since trip state only lives
   *   in memory. Unlike acceptTask this ignores the per-trip cap; they're already theirs.
   * - drops ones the backend no longer has as theirs (cancelled elsewhere, reset by an
   *   admin) — but never once the trip has started or the run's pickup is done, and never
   *   a run accepted after `requestedAt`, which that response couldn't know about yet.
   */
  syncAccepted: (tasks: Task[], requestedAt: number) => void;
  /** Removes a run's stops. Ignored once the trip has started. */
  cancelTask: (taskId: string) => void;
  /** Marks a stop done — used by the Handover screen for both pickups and drop-offs. */
  completeStop: (stopId: string) => void;
  /** True once the volunteer has moved a stop by hand, until they reset to the suggestion. */
  orderCustomised: boolean;
  /** Moves the stop at index `from` to `to`. Returns false (and changes nothing) if that isn't allowed. */
  reorder: (from: number, to: number) => boolean;
  resetToSuggestedOrder: () => void;
  isAccepted: (taskId: string) => boolean;
  acceptedCount: number;
  /** False once the trip holds MAX_RUNS_PER_TRIP runs; acceptTask then does nothing. */
  canAcceptMore: boolean;
};

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [stops, setStops] = useState<TripStop[]>([]);
  const [tripStatus, setTripStatus] = useState<TripStatus>('ready');
  const [routeId, setRouteId] = useState<string | null>(null);
  // Read from async callbacks (resumeRoute), which would otherwise see a stale value.
  const routeIdRef = useRef(routeId);
  useEffect(() => {
    routeIdRef.current = routeId;
  }, [routeId]);
  const [orderCustomised, setOrderCustomised] = useState(false);
  // The suggestion starts from wherever the volunteer is now. Read only when the order is
  // (re)computed — moving around doesn't reshuffle stops under them.
  const { coords, setHighAccuracy } = useLocation();
  // When each run was accepted in this session, so a sync whose request was already in
  // flight can't drop a run it simply hadn't heard of yet.
  const acceptedAt = useRef(new Map<string, number>());
  const acceptedCount = new Set(stops.map((stop) => stop.taskId)).size;
  const canAcceptMore = acceptedCount < MAX_RUNS_PER_TRIP;

  function startTrip() {
    setTripStatus('active');
    setHighAccuracy(true);
  }

  // Only callable once every stop is done — the UI gates the button on this, and this
  // is the actual finish line, so a completed trip's stops are cleared, not reset.
  function endTrip() {
    if (!stops.every((stop) => stop.done)) return;
    setTripStatus('ready');
    setHighAccuracy(false);
    setRouteId(null);
    setStops([]);
    setOrderCustomised(false);
  }

  // The app suggests an order; once the volunteer has changed it, new runs are appended
  // instead so their choice isn't overwritten.
  function arrange(next: TripStop[]) {
    return orderCustomised ? next : recommendStopOrder(next, coords ?? undefined);
  }

  function acceptTask(task: Task) {
    if (!canAcceptMore || stops.some((stop) => stop.taskId === task.id)) return;
    acceptedAt.current.set(task.id, Date.now());
    setStops(arrange([...stops, ...taskToStops(task)]));
  }

  function resumeRoute(
    id: string,
    status: 'planned' | 'active',
    order: { pickupId: string; type: TripStop['type'] }[]
  ) {
    if (routeIdRef.current) return;
    routeIdRef.current = id;
    setRouteId(id);
    if (status !== 'active') return;
    setTripStatus('active');
    setHighAccuracy(true);
    if (order.length > 0) {
      setStops((prev) => orderLikeRoute(prev, order));
      // The route's order is now the one in use — keep later syncs from re-suggesting.
      setOrderCustomised(true);
    }
  }

  function syncAccepted(tasks: Task[], requestedAt: number) {
    setStops((prev) => {
      const { missing, gone } = planTripSync(prev, tasks, {
        tripStarted: tripStatus === 'active',
        requestedAt,
        acceptedAt: acceptedAt.current,
      });
      // The backend is the source of truth for pickup ids: fill them in on runs accepted
      // before ids were known (or fix them if they changed).
      const pickupIdOf = new Map(tasks.map((task) => [task.id, task.pickupId]));
      const needsId = (stop: TripStop) => {
        const id = pickupIdOf.get(stop.taskId);
        return id !== undefined && id !== stop.pickupId;
      };
      if (missing.length === 0 && gone.size === 0 && !prev.some(needsId)) return prev;

      gone.forEach((taskId) => acceptedAt.current.delete(taskId));
      const kept = prev
        .filter((stop) => !gone.has(stop.taskId))
        .map((stop) => (needsId(stop) ? { ...stop, pickupId: pickupIdOf.get(stop.taskId) } : stop));
      // Only reshuffle when the set of runs changed; filling in ids keeps the order.
      if (missing.length === 0 && gone.size === 0) return kept;
      return arrange([...kept, ...missing.flatMap(taskToStops)]);
    });
  }

  function cancelTask(taskId: string) {
    // Runs are fixed once the trip is under way (and so their pickups are done or due).
    if (tripStatus === 'active') return;
    const next = stops.filter((stop) => stop.taskId !== taskId);
    setStops(arrange(next));
    if (next.length === 0) setOrderCustomised(false);
  }

  function reorder(from: number, to: number) {
    const next = reorderStops(stops, from, to);
    if (!next) return false;
    setStops(next);
    setOrderCustomised(true);
    return true;
  }

  function resetToSuggestedOrder() {
    setStops(recommendStopOrder(stops, coords ?? undefined));
    setOrderCustomised(false);
  }

  function completeStop(stopId: string) {
    setStops((prev) => prev.map((stop) => (stop.id === stopId ? { ...stop, done: true } : stop)));
  }

  function isAccepted(taskId: string) {
    return stops.some((stop) => stop.taskId === taskId);
  }

  return (
    <TripContext.Provider
      value={{
        stops,
        tripStatus,
        routeId,
        setRouteId,
        startTrip,
        endTrip,
        resumeRoute,
        acceptTask,
        syncAccepted,
        cancelTask,
        completeStop,
        orderCustomised,
        reorder,
        resetToSuggestedOrder,
        isAccepted,
        acceptedCount,
        canAcceptMore,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
}
