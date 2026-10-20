import { requestToTask } from '@/lib/mappers';
import { ApiRequest } from '@/types/api';

function request(overrides: Partial<ApiRequest> = {}): ApiRequest {
  return {
    id: 'r1',
    description: null,
    urgency: 'high',
    pickup_lat: -37.8,
    pickup_lng: 144.97,
    dropoff_lat: -37.77,
    dropoff_lng: 144.96,
    tag: 'education',
    total_package_size: 'small',
    organisations: { name: 'Northside Community Clinic' },
    request_items: [{ id: 'i1', item_type: 'Gloves', quantity: 4 }],
    ...overrides,
  };
}

describe('requestToTask', () => {
  it('maps the org name, team, urgency and coordinates', () => {
    const task = requestToTask(request());
    expect(task).toMatchObject({
      id: 'r1',
      orgName: 'Northside Community Clinic',
      team: 'education',
      urgency: 'urgent',
      itemType: 'Gloves',
      pickupCoords: { lat: -37.8, lng: 144.97 },
      dropoffCoords: { lat: -37.77, lng: 144.96 },
    });
  });

  it('summarises the item lines when there is no description', () => {
    const task = requestToTask(
      request({
        request_items: [
          { id: 'i1', item_type: 'Gloves', quantity: 4 },
          { id: 'i2', item_type: 'Masks', quantity: 8 },
        ],
      })
    );
    expect(task.itemSummary).toBe('4 × Gloves, 8 × Masks');
    expect(task.itemType).toBe('Mixed items');
  });

  it("prefers the org's description", () => {
    expect(requestToTask(request({ description: '  Sealed boxes  ' })).itemSummary).toBe(
      'Sealed boxes'
    );
  });

  it('takes the pickup id from /accepted-requests, preferring one still in play', () => {
    expect(requestToTask(request()).pickupId).toBeUndefined();
    const task = requestToTask(
      request({
        pickups: [
          { id: 'old', route_id: null, status: 'delivered' },
          { id: 'live', route_id: null, status: 'assigned' },
        ],
      })
    );
    expect(task.pickupId).toBe('live');
  });

  it('falls back for missing org, tag and drop-off', () => {
    const task = requestToTask(
      request({ organisations: null, tag: null, dropoff_lat: null, dropoff_lng: null })
    );
    expect(task.orgName).toBeNull();
    expect(task.team).toBe('donations');
    expect(task.dropoffCoords).toBeNull();
  });
});
