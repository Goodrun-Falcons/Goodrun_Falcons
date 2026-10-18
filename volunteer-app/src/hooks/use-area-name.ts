import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { distanceKm } from '@/lib/stop-order';
import { Coordinates } from '@/types/task';

// The OS geocoders rate-limit, and the suburb only changes every few km anyway.
const REGEOCODE_AFTER_KM = 1;

/** Suburb and state for `coords`, e.g. "Brunswick, VIC". Null until it's been looked up. */
export function useAreaName(coords: Coordinates | null): string | null {
  const [areaName, setAreaName] = useState<string | null>(null);
  const lastLookup = useRef<Coordinates | null>(null);

  useEffect(() => {
    // reverseGeocodeAsync is only implemented on iOS and Android.
    if (!coords || Platform.OS === 'web') return;
    if (lastLookup.current && distanceKm(lastLookup.current, coords) < REGEOCODE_AFTER_KM) return;
    lastLookup.current = coords;

    let cancelled = false;
    let settled = false;
    Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng })
      .then(([address]) => {
        settled = true;
        if (cancelled || !address) return;
        const suburb = address.city ?? address.district ?? address.subregion;
        const name = [suburb, address.region].filter(Boolean).join(', ');
        if (name) setAreaName(name);
      })
      .catch(() => {
        settled = true;
        // Keep the previous name; allow a retry on the next position update.
        lastLookup.current = null;
      });
    return () => {
      cancelled = true;
      // Superseded before it answered — let the next position look up again.
      if (!settled) lastLookup.current = null;
    };
  }, [coords]);

  return areaName;
}
