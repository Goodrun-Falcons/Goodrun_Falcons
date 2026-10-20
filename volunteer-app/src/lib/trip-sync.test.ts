import { planTripSync, routeStopsPayload } from '@/lib/trip-sync';
import { Task } from '@/types/task';
import { TripStop } from '@/types/trip';

function task(id: string): Task {
  return {
    id,
    orgName: null,
    itemType: 'Gloves',
    itemSummary: '',
    urgency: 'soon',
    team: 'donations',
    pickupAddress: '',
    dropoffAddress: '',
    pickupCoords: { lat: 0, lng: 0 },
    dropoffCoords: { lat: 0, lng: 0.01 },
  };
}

function stopsFor(taskId: string, pickupDone = false, pickupId?: string): TripStop[] {
  const base = {
    taskId,
    pickupId,
    org: null,
    address: '',
    itemType: '',
    item: '',
    coords: { lat: 0, lng: 0 },
  };
  return [
    { ...base, id: `${taskId}:pickup`, type: 'pickup', done: pickupDone },
    { ...base, id: `${taskId}:dropoff`, type: 'dropoff', done: false },
  ];
}

const now = 1_000;
const options = { tripStarted: false, requestedAt: now, acceptedAt: new Map<string, number>() };

describe('planTripSync', () => {
  it('adds runs the backend holds but the trip is missing', () => {
    const { missing, gone } = planTripSync(stopsFor('a'), [task('a'), task('b')], options);
    expect(missing.map((t) => t.id)).toEqual(['b']);
    expect(gone.size).toBe(0);
  });

  it('drops runs the backend no longer has as the volunteer’s', () => {
    const { gone } = planTripSync([...stopsFor('a'), ...stopsFor('b')], [task('a')], options);
    expect([...gone]).toEqual(['b']);
  });

  it('keeps a run accepted after the request went out', () => {
    const acceptedAt = new Map([['b', now + 1]]);
    const { gone } = planTripSync(stopsFor('b'), [], { ...options, acceptedAt });
    expect(gone.size).toBe(0);
  });

  it('keeps a run whose pickup is done', () => {
    expect(planTripSync(stopsFor('b', true), [], options).gone.size).toBe(0);
  });

  it('never drops anything once the trip has started', () => {
    const { gone } = planTripSync(stopsFor('b'), [], { ...options, tripStarted: true });
    expect(gone.size).toBe(0);
  });
});

describe('routeStopsPayload', () => {
  it('numbers the stops in their current order', () => {
    const stops = [
      stopsFor('a', false, 'p-a')[0],
      ...stopsFor('b', false, 'p-b'),
      stopsFor('a', false, 'p-a')[1],
    ];
    expect(routeStopsPayload(stops)).toEqual([
      { pickup_id: 'p-a', stop_type: 'pickup', sequence_number: 1 },
      { pickup_id: 'p-b', stop_type: 'pickup', sequence_number: 2 },
      { pickup_id: 'p-b', stop_type: 'dropoff', sequence_number: 3 },
      { pickup_id: 'p-a', stop_type: 'dropoff', sequence_number: 4 },
    ]);
  });

  it('refuses stops without a pickup id', () => {
    expect(routeStopsPayload(stopsFor('a'))).toBeNull();
  });

  it('refuses a run with no drop-off stop', () => {
    expect(routeStopsPayload([stopsFor('a', false, 'p-a')[0]])).toBeNull();
  });
});
