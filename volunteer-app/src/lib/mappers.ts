import { ApiRequest, ApiRequestUrgency } from '@/types/api';
import { Task, TaskTeam, TaskUrgency } from '@/types/task';

const URGENCY: Record<ApiRequestUrgency, TaskUrgency> = {
  high: 'urgent',
  medium: 'soon',
  low: 'flexible',
};

// Every run in the app has a team, but the backend allows none on older rows. Until
// that column is required, file those under Donations rather than hide them.
const UNTAGGED_TEAM: TaskTeam = 'donations';

/** "Gloves" for one kind of item, "Mixed items" for several. */
function itemTypeLabel(request: ApiRequest): string {
  const types = [...new Set(request.request_items.map((item) => item.item_type))];
  if (types.length === 1) return types[0];
  return types.length === 0 ? 'Delivery' : 'Mixed items';
}

/** The org's own description, else the item lines: "4 × gloves, 8 × masks". */
function itemSummary(request: ApiRequest): string {
  const description = request.description?.trim();
  if (description) return description;
  const lines = request.request_items.map((item) => `${item.quantity} × ${item.item_type}`);
  return lines.length > 0 ? lines.join(', ') : 'No item details';
}

export function requestToTask(request: ApiRequest): Task {
  return {
    id: request.id,
    orgName: request.organisations?.name ?? null,
    itemType: itemTypeLabel(request),
    itemSummary: itemSummary(request),
    urgency: URGENCY[request.urgency] ?? 'flexible',
    team: request.tag ?? UNTAGGED_TEAM,
    // Requests only carry coordinates, so these are placeholders until the backend (or
    // reverse geocoding) supplies street addresses.
    pickupAddress: 'Pickup location',
    dropoffAddress: 'Drop-off location',
    pickupCoords: { lat: request.pickup_lat, lng: request.pickup_lng },
    dropoffCoords:
      request.dropoff_lat !== null && request.dropoff_lng !== null
        ? { lat: request.dropoff_lat, lng: request.dropoff_lng }
        : null,
  };
}
