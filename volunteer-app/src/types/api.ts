/**
 * Raw shapes returned by the GoodRun backend (see the "GoodRun API" doc), mirroring the
 * selects in backend/src/api/*.ts on feature/api-items — the branch currently deployed.
 * The UI never uses these directly — see src/lib/mappers.ts.
 */

import { TaskTeam } from '@/types/task';

export type ApiRequestUrgency = 'low' | 'medium' | 'high';

export type ApiRequestStatus =
  'pending' | 'approved' | 'rejected' | 'accepted' | 'in_transit' | 'delivered';

/** One line of a request — a request can carry several item types. */
export type ApiRequestItem = {
  id: string;
  item_type: string;
  quantity: number;
};

/**
 * A delivery request as listed by GET /requests (open ones, status `pending`) and
 * GET /accepted-requests (the volunteer's own, status `accepted`).
 */
export type ApiRequest = {
  id: string;
  description: string | null;
  urgency: ApiRequestUrgency;
  // `pickup_location` / `dropoff_location` come back as unusable EWKB hex, so read the
  // generated lat/lng columns instead. dropoff is nullable.
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  /** Nullable for rows created before tags existed. */
  tag: TaskTeam | null;
  total_package_size: string | null;
  /** No longer selected by GET /requests or /accepted-requests; kept for when it returns. */
  organisations?: { name: string } | null;
  request_items: ApiRequestItem[];
};

export type ApiPickupStatus = 'assigned' | 'en_route' | 'picked_up' | 'delivered';

/** Returned by POST /requests/:id/accept. */
export type ApiPickup = {
  id: string;
  request_id: string;
  volunteer_id: string;
  route_id: string | null;
  status: ApiPickupStatus;
  handover_photo_url: string | null;
  handover_timestamp: string | null;
  started_at: string | null;
  ended_at: string | null;
};

export type ApiRouteStatus = 'planned' | 'active' | 'completed';

export type ApiRoute = {
  id: string;
  volunteer_id: string;
  status: ApiRouteStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
};

// route_stops has no migration in the repo yet — inferred from the select in GET /routes/:id.
export type ApiRouteStop = {
  id: string;
  stop_type: 'pickup' | 'dropoff';
  sequence_number: number;
  status: string;
  arrival_time: string | null;
  completion_time: string | null;
  pickups:
    | (ApiPickup & {
        requests: {
          id: string;
          description: string | null;
          urgency: ApiRequestUrgency;
          status: ApiRequestStatus;
          organisation_id: string;
        };
      })
    | null;
};

export type ApiRouteWithStops = ApiRoute & {
  current_location: unknown;
  route_stops: ApiRouteStop[];
};
