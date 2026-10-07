import { createContext, ReactNode, useContext, useState } from 'react';

import { WAREHOUSE_COORDS } from '@/data/mock-tasks';
import { Task } from '@/types/task';
import { TripStop } from '@/types/trip';

const WAREHOUSE_STOP_ID = 'warehouse-dropoff';

export type TripStatus = 'ready' | 'active';

function taskToStop(task: Task): TripStop {
  const isPickup = task.type === 'pickup';
  return {
    id: `task-${task.id}`,
    org: task.orgName,
    address: isPickup ? task.pickupAddress : task.deliveryAddress,
    item: task.itemSummary,
    type: isPickup ? 'pickup' : 'dropoff',
    coords: task.orgCoords,
    done: false,
  };
}

const warehouseStop: TripStop = {
  id: WAREHOUSE_STOP_ID,
  org: 'Medical Pantry Warehouse',
  address: '8 Dawson St, Brunswick',
  item: 'Drop off all items',
  type: 'dropoff',
  coords: WAREHOUSE_COORDS,
  done: false,
};

type TripContextValue = {
  stops: TripStop[];
  setStops: React.Dispatch<React.SetStateAction<TripStop[]>>;
  tripStatus: TripStatus;
  startTrip: () => void;
  endTrip: () => void;
  acceptTask: (task: Task) => void;
  removeStop: (stopId: string) => void;
  /** Marks a stop done — used by both the dropoff "Done" button and the Handover
   * screen's pickup confirmation. */
  completeStop: (stopId: string) => void;
  isAccepted: (taskId: string) => boolean;
  /** Runs actually accepted, excluding the auto-appended warehouse drop-off. */
  acceptedCount: number;
};

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [stops, setStops] = useState<TripStop[]>([]);
  const [tripStatus, setTripStatus] = useState<TripStatus>('ready');
  const acceptedCount = stops.filter((stop) => stop.id !== WAREHOUSE_STOP_ID).length;

  function startTrip() {
    setTripStatus('active');
  }

  // Only callable once every stop is done — the UI gates the button on this, and this
  // is the actual finish line, so a completed trip's stops are cleared, not reset.
  function endTrip() {
    if (!stops.every((stop) => stop.done)) return;
    setTripStatus('ready');
    setStops([]);
  }

  function acceptTask(task: Task) {
    const stopId = `task-${task.id}`;
    setStops((prev) => {
      if (prev.some((stop) => stop.id === stopId)) return prev;
      const withoutWarehouse = prev.filter((stop) => stop.id !== WAREHOUSE_STOP_ID);
      const next = [...withoutWarehouse, taskToStop(task)];
      const hasPickup = next.some((stop) => stop.type === 'pickup');
      return hasPickup ? [...next, warehouseStop] : next;
    });
  }

  function removeStop(stopId: string) {
    setStops((prev) => {
      const next = prev.filter((stop) => stop.id !== stopId && stop.id !== WAREHOUSE_STOP_ID);
      const hasPickup = next.some((stop) => stop.type === 'pickup');
      return hasPickup ? [...next, warehouseStop] : next;
    });
  }

  function completeStop(stopId: string) {
    setStops((prev) => prev.map((stop) => (stop.id === stopId ? { ...stop, done: true } : stop)));
  }

  function isAccepted(taskId: string) {
    return stops.some((stop) => stop.id === `task-${taskId}`);
  }

  return (
    <TripContext.Provider
      value={{
        stops,
        setStops,
        tripStatus,
        startTrip,
        endTrip,
        acceptTask,
        removeStop,
        completeStop,
        isAccepted,
        acceptedCount,
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
