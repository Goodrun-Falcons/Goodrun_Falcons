import { distanceKm, isValidOrder, recommendStopOrder, reorderStops } from '@/lib/stop-order';
import { TripStop } from '@/types/trip';

function stop(taskId: string, type: 'pickup' | 'dropoff', lat: number, lng: number): TripStop {
  return {
    id: `${taskId}:${type}`,
    taskId,
    org: taskId,
    address: '',
    item: '',
    type,
    coords: { lat, lng },
    done: false,
  };
}

// Along a line: a near, b far, warehouse (drop-off for both) in the middle.
const aPickup = stop('a', 'pickup', 0, 0);
const aDropoff = stop('a', 'dropoff', 0, 0.05);
const bPickup = stop('b', 'pickup', 0, 0.1);
const bDropoff = stop('b', 'dropoff', 0, 0.05);

const ids = (stops: TripStop[]) => stops.map((s) => s.id);

describe('distanceKm', () => {
  it('is zero for the same point and roughly 111 km per degree of latitude', () => {
    expect(distanceKm({ lat: 1, lng: 1 }, { lat: 1, lng: 1 })).toBe(0);
    expect(distanceKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.2, 0);
  });
});

describe('isValidOrder', () => {
  it('rejects a drop-off before its own pickup', () => {
    expect(isValidOrder([aPickup, aDropoff])).toBe(true);
    expect(isValidOrder([aDropoff, aPickup])).toBe(false);
  });
});

describe('recommendStopOrder', () => {
  it('never puts a drop-off before its pickup', () => {
    const order = recommendStopOrder([bPickup, bDropoff, aPickup, aDropoff]);
    expect(isValidOrder(order)).toBe(true);
    expect(order).toHaveLength(4);
  });

  it('gives the same suggestion whatever order the stops arrive in', () => {
    const one = recommendStopOrder([aPickup, aDropoff, bPickup, bDropoff]);
    const two = recommendStopOrder([bDropoff, bPickup, aDropoff, aPickup]);
    expect(ids(one)).toEqual(ids(two));
  });

  it('starts from the given location', () => {
    const order = recommendStopOrder([bPickup, bDropoff, aPickup, aDropoff], { lat: 0, lng: 0 });
    expect(ids(order)[0]).toBe('a:pickup');
  });

  it('collects both pickups before a shared warehouse instead of going there twice', () => {
    // The warehouse is closer to the first pickup than the second pickup is, so always
    // driving to the nearest stop would visit it twice; the shortest route doesn't.
    const warehouse = { lat: 0.02, lng: 0 };
    const order = recommendStopOrder(
      [
        stop('a', 'pickup', 0, 0),
        stop('a', 'dropoff', warehouse.lat, warehouse.lng),
        stop('b', 'pickup', 0.025, 0.01),
        stop('b', 'dropoff', warehouse.lat, warehouse.lng),
      ],
      { lat: 0, lng: 0 }
    );
    expect(ids(order).slice(0, 2)).toEqual(['a:pickup', 'b:pickup']);
  });

  it('keeps finished stops at the front', () => {
    const done = { ...bPickup, done: true };
    const order = recommendStopOrder([aPickup, aDropoff, done, bDropoff]);
    expect(ids(order)[0]).toBe('b:pickup');
    expect(isValidOrder(order)).toBe(true);
  });
});

describe('reorderStops', () => {
  const list = [aPickup, bPickup, aDropoff, bDropoff];

  it('moves a stop when every drop-off still follows its pickup', () => {
    expect(ids(reorderStops(list, 0, 1)!)).toEqual([
      'b:pickup',
      'a:pickup',
      'a:dropoff',
      'b:dropoff',
    ]);
    expect(ids(reorderStops(list, 3, 2)!)).toEqual([
      'a:pickup',
      'b:pickup',
      'b:dropoff',
      'a:dropoff',
    ]);
  });

  it('rejects dropping a drop-off before its own pickup', () => {
    expect(reorderStops(list, 2, 0)).toBeNull();
    expect(reorderStops([aPickup, aDropoff], 1, 0)).toBeNull();
  });

  it('rejects out-of-range and no-op moves', () => {
    expect(reorderStops(list, 0, 0)).toBeNull();
    expect(reorderStops(list, 0, 9)).toBeNull();
    expect(reorderStops(list, -1, 1)).toBeNull();
  });

  it('keeps finished stops at the front', () => {
    const withDone = [{ ...aPickup, done: true }, bPickup, aDropoff, bDropoff];
    expect(reorderStops(withDone, 1, 0)).toBeNull();
    expect(reorderStops(withDone, 0, 2)).toBeNull();
    expect(reorderStops(withDone, 2, 3)).not.toBeNull();
  });
});
