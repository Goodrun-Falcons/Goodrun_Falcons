export type TaskType = 'pickup' | 'delivery';

export type TaskUrgency = 'urgent' | 'soon' | 'flexible';

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Task = {
  id: string;
  type: TaskType;
  orgName: string;
  itemSummary: string;
  distanceKm: number;
  urgency: TaskUrgency;
  /** ISO date (yyyy-mm-dd) the item needs to be moved by. */
  dueBy: string;
  pickupAddress: string;
  deliveryAddress: string;
  /** Estimated drive time from pickup to delivery address, in minutes. */
  etaMinutes: number;
  /** Coordinates of the partner org's location (whichever end of the run isn't the warehouse). */
  orgCoords: Coordinates;
};
