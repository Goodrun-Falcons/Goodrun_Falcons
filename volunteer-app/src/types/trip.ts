import { Coordinates } from '@/types/task';

export type StopType = 'pickup' | 'dropoff';

export type TripStop = {
  id: string;
  /** The run (backend item) this stop belongs to — every run has a pickup and a drop-off stop. */
  taskId: string;
  org: string;
  address: string;
  item: string;
  type: StopType;
  coords: Coordinates;
  done: boolean;
};
