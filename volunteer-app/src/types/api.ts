/**
 * Raw shapes returned by the GoodRun backend, mirroring the Supabase schema
 * (supabase/migrations on Web-App-Dev) and the selects in backend/src/api/*.ts.
 * The UI never uses these directly — see src/lib/mappers.ts.
 */

import { TaskTeam } from '@/types/task';

export type ApiItemUrgency = 'low' | 'medium' | 'high';

export type ApiItemStatus =
  'pending' | 'approved' | 'rejected' | 'accepted' | 'in_transit' | 'delivered';

export type ApiItem = {
  id: string;
  organisation_id: string;
  item_type: string;
  quantity: number;
  description: string | null;
  urgency: ApiItemUrgency;
  status: ApiItemStatus;
  created_at: string;
  // `pickup_location` / `dropoff_location` come back as unusable EWKB hex, so read the
  // generated lat/lng columns instead. dropoff is nullable.
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  // Team tag (`requests.tag` on the feature/multi-item-requests-and-tags branch). Not on
  // the deployed backend yet, and nullable there for rows created before it existed.
  tag?: TaskTeam | null;
};

export type ApiPickupStatus = 'assigned' | 'en_route' | 'picked_up' | 'delivered';

export type ApiPickup = {
  id: string;
  item_id: string;
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
  pickups: (ApiPickup & { items: ApiItem }) | null;
};

export type ApiRouteWithStops = ApiRoute & {
  current_location: unknown;
  route_stops: ApiRouteStop[];
};
