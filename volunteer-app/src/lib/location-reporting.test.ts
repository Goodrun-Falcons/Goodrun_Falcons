import { pickupsToTrack, shouldReportLocation } from '@/lib/location-reporting';
import { TripStop } from '@/types/trip';

const here = { lat: -37.8, lng: 144.96 };
// ~111 m north per 0.001° of latitude.
const near = { lat: -37.8003, lng: 144.96 }; // ~33 m
const far = { lat: -37.801, lng: 144.96 }; // ~111 m

describe('shouldReportLocation', () => {
  it('always sends the first fix', () => {
    expect(shouldReportLocation(null, here, 0)).toBe(true);
  });

  it('waits for 50 m of movement or 30 s', () => {
    const last = { coords: here, at: 0 };
    expect(shouldReportLocation(last, near, 10_000)).toBe(false);
    expect(shouldReportLocation(last, far, 10_000)).toBe(true);
    expect(shouldReportLocation(last, near, 30_000)).toBe(true);
  });
});

function stop(taskId: string, type: 'pickup' | 'dropoff', done: boolean): TripStop {
  return {
    id: `${taskId}:${type}`,
    taskId,
    pickupId: `p-${taskId}`,
    org: null,
    address: '',
    itemType: '',
    item: '',
    type,
    coords: here,
    done,
  };
}

describe('pickupsToTrack', () => {
  it('lists each run still under way once, dropping delivered ones', () => {
    const stops = [
      stop('a', 'pickup', true),
      stop('b', 'pickup', true),
      stop('a', 'dropoff', true), // a delivered
      stop('b', 'dropoff', false),
    ];
    expect(pickupsToTrack(stops)).toEqual(['p-b']);
  });

  it('skips stops without a pickup id', () => {
    expect(pickupsToTrack([{ ...stop('a', 'pickup', false), pickupId: undefined }])).toEqual([]);
  });
});
