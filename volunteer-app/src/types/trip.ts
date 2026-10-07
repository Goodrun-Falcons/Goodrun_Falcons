import { Coordinates } from '@/types/task';

export type StopType = 'pickup' | 'dropoff';

export type TripStop = {
  id: string;
  org: string;
  address: string;
  item: string;
  type: StopType;
  coords: Coordinates;
  done: boolean;
};
