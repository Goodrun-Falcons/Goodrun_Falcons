import { createContext, ReactNode, useContext, useState } from 'react';

import { useLocation } from '@/context/location-context';
import { MAX_RUNS_PER_TRIP, recommendStopOrder, reorderStops } from '@/lib/stop-order';
import { Task } from '@/types/task';
import { TripStop } from '@/types/trip';

export type TripStatus = 'ready' | 'active';

function taskToStops(task: Task): TripStop[] {
  const pickup: TripStop = {
    id: `${task.id}:pickup`,
    taskId: task.id,
    org: task.orgName,
    address: task.pickupAddress,
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
  startTrip: () => void;
  endTrip: () => void;
  acceptTask: (task: Task) => void;
  /** Removes a run's stops. Ignored once its pickup is done. */
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
  const [orderCustomised, setOrderCustomised] = useState(false);
  // The suggestion starts from wherever the volunteer is now. Read only when the order is
  // (re)computed — moving around doesn't reshuffle stops under them.
  const { coords, setHighAccuracy } = useLocation();
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
    setStops(arrange([...stops, ...taskToStops(task)]));
  }

  function cancelTask(taskId: string) {
    const pickupDone = stops.some(
      (stop) => stop.taskId === taskId && stop.type === 'pickup' && stop.done
    );
    if (pickupDone) return;
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
        startTrip,
        endTrip,
        acceptTask,
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
