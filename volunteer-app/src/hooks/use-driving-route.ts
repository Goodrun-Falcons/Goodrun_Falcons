import { useEffect, useRef, useState } from 'react';

import { DrivingRoute, fetchDrivingRoute } from '@/lib/mapbox-directions';
import { distanceKm } from '@/lib/stop-order';
import { Coordinates } from '@/types/task';

// GPS updates arrive every few metres; re-request only once the volunteer has moved
// far enough that the first leg (and its ETA) is noticeably out of date.
const REFETCH_AFTER_KM = 0.3;

function toKey(points: Coordinates[]) {
  return points.map((p) => `${p.lng},${p.lat}`).join(';');
}

function fromKey(key: string): Coordinates[] {
  return key
    .split(';')
    .filter(Boolean)
    .map((pair) => {
      const [lng, lat] = pair.split(',').map(Number);
      return { lat, lng };
    });
}

/**
 * Road route from `origin` (when known) through `stops` in order. Re-requested when the
 * stops change or the origin drifts more than REFETCH_AFTER_KM — not on every GPS fix.
 * Null while loading, on failure, or with fewer than two points; callers fall back to
 * straight lines.
 */
export function useDrivingRoute(
  origin: Coordinates | null,
  stops: Coordinates[]
): DrivingRoute | null {
  const [route, setRoute] = useState<DrivingRoute | null>(null);
  const lastRequest = useRef<{ origin: Coordinates | null; stopsKey: string } | null>(null);
  // Depend on the stops' content, not the array's identity (it's rebuilt every render).
  const stopsKey = toKey(stops);

  useEffect(() => {
    const last = lastRequest.current;
    const originUnchanged =
      last !== null &&
      (last.origin && origin
        ? distanceKm(last.origin, origin) < REFETCH_AFTER_KM
        : last.origin === origin);
    if (last?.stopsKey === stopsKey && originUnchanged) return;

    const points = [...(origin ? [origin] : []), ...fromKey(stopsKey)];
    lastRequest.current = { origin, stopsKey };
    if (points.length < 2) return;

    // Not aborted on cleanup: this effect re-runs on every GPS fix (and usually returns
    // early above), which would cancel a request that's still the latest one. A newer
    // request just makes this one's answer stale instead.
    const request = lastRequest.current;
    fetchDrivingRoute(points)
      .then((next) => {
        if (lastRequest.current === request) setRoute(next);
      })
      .catch(() => {
        // Offline etc. — keep showing the previous route and retry on the next fix.
        if (lastRequest.current === request) lastRequest.current = null;
      });
  }, [origin, stopsKey]);

  // A route left over from before the stops dropped below two points isn't one any more.
  const enoughPoints = (origin ? 1 : 0) + stops.length >= 2;
  return enoughPoints ? route : null;
}
