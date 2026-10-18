import { ApiItem, ApiItemUrgency } from '@/types/api';
import { Task, TaskTeam, TaskUrgency } from '@/types/task';

const URGENCY: Record<ApiItemUrgency, TaskUrgency> = {
  high: 'urgent',
  medium: 'soon',
  low: 'flexible',
};

// Every run in the app has a team, but the backend allows none on older rows. Until
// that column is required, file those under Donations rather than hide them.
const UNTAGGED_TEAM: TaskTeam = 'donations';

/**
 * `organisation` is optional because GET /items only returns `organisation_id` — the
 * name and address have to come from a join the backend doesn't do yet.
 */
export function itemToTask(
  item: ApiItem,
  organisation?: { name: string; address?: string | null }
): Task {
  return {
    id: item.id,
    orgName: organisation?.name ?? 'Organisation',
    itemType: item.item_type,
    itemSummary: item.description?.trim() || `${item.quantity} × ${item.item_type}`,
    urgency: URGENCY[item.urgency],
    team: item.tag ?? UNTAGGED_TEAM,
    // Items only carry coordinates, so these are placeholders until the backend (or Mapbox
    // reverse geocoding) supplies street addresses.
    pickupAddress: organisation?.address ?? 'Pickup location',
    dropoffAddress: 'Drop-off location',
    pickupCoords: { lat: item.pickup_lat, lng: item.pickup_lng },
    dropoffCoords:
      item.dropoff_lat !== null && item.dropoff_lng !== null
        ? { lat: item.dropoff_lat, lng: item.dropoff_lng }
        : null,
  };
}
