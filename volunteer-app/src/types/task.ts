export type TaskUrgency = 'urgent' | 'soon' | 'flexible';

/** Internal team a run belongs to — see src/lib/teams.ts for labels. */
export type TaskTeam =
  | 'animal_welfare'
  | 'donations'
  | 'education'
  | 'funders_and_grants'
  | 'humanitarian_aid'
  | 'innovation';

export type Coordinates = {
  lat: number;
  lng: number;
};

/** UI-facing run. Built from a backend item by src/lib/mappers.ts. */
export type Task = {
  id: string;
  orgName: string;
  /** The backend's `item_type`, e.g. "wheelchair". */
  itemType: string;
  itemSummary: string;
  urgency: TaskUrgency;
  team: TaskTeam;
  /** ISO date (yyyy-mm-dd) the item needs to be moved by. Not in the backend yet. */
  dueBy?: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoords: Coordinates;
  /** Null when the backend item has no drop-off point. */
  dropoffCoords: Coordinates | null;
  /** Computed by the backend from the volunteer's location. Absent until that exists. */
  distanceKm?: number;
  /** Estimated drive time from pickup to drop-off, in minutes. */
  etaMinutes?: number;
  /** Drive time from the volunteer's current position to the pickup, in minutes. */
  minutesToPickup?: number;
};
