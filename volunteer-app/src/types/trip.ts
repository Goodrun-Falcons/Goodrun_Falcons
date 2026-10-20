import { Coordinates } from '@/types/task';

export type StopType = 'pickup' | 'dropoff';

/** What a stop is called on screen: the org, or the kind of item when the org is unknown. */
export function stopTitle(stop: Pick<TripStop, 'org' | 'itemType'>): string {
  return stop.org ?? stop.itemType;
}

export type TripStop = {
  id: string;
  /** The run (backend item) this stop belongs to — every run has a pickup and a drop-off stop. */
  taskId: string;
  /** The backend pickup this stop belongs to (both of a run's stops share it). */
  pickupId?: string;
  /** Null when the backend didn't send it — use stopTitle() for a heading. */
  org: string | null;
  address: string;
  /** e.g. "Gloves" or "Mixed items" — the heading when there's no org name. */
  itemType: string;
  item: string;
  type: StopType;
  coords: Coordinates;
  done: boolean;
};
