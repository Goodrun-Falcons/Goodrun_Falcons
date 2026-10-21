import * as Location from 'expo-location';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { Coordinates } from '@/types/task';

/**
 * `blocked` means the OS won't show the prompt again (denied with "don't ask again", or
 * turned off in Settings) — the only way back is the Settings app.
 */
export type LocationStatus = 'checking' | 'granted' | 'denied' | 'blocked';

// Browsing (Nearby): ~100 m accuracy and an update every 20 m is plenty, and cheap on
// battery. During a trip the dot, the ETA and arrival detection need GPS-grade fixes.
const BROWSING = { accuracy: Location.Accuracy.Balanced, distanceInterval: 20 };
const NAVIGATING = { accuracy: Location.Accuracy.High, distanceInterval: 5 };

type LocationContextValue = {
  /** Latest known position. Null until the first fix, or if permission isn't granted. */
  coords: Coordinates | null;
  status: LocationStatus;
  /** Shows the OS prompt, or opens Settings if the prompt can't be shown any more. */
  requestPermission: () => Promise<void>;
  /** Switches to GPS-grade, more frequent fixes (for an active trip) and back. */
  setHighAccuracy: (on: boolean) => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

function toStatus(response: Location.LocationPermissionResponse): LocationStatus {
  if (response.granted) return 'granted';
  return response.canAskAgain ? 'denied' : 'blocked';
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>('checking');
  const [highAccuracy, setHighAccuracy] = useState(false);

  // Ask once on launch; after that the screens offer requestPermission() instead.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = await Location.getForegroundPermissionsAsync();
      const response =
        current.granted || !current.canAskAgain
          ? current
          : await Location.requestForegroundPermissionsAsync();
      if (!cancelled) setStatus(toStatus(response));
    })();

    // Coming back from Settings (see requestPermission) is the only way out of
    // `blocked`, so re-check whenever the app returns to the foreground.
    const appStateSub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      const response = await Location.getForegroundPermissionsAsync();
      if (!cancelled) setStatus(toStatus(response));
    });
    return () => {
      cancelled = true;
      appStateSub.remove();
    };
  }, []);

  // One shared watcher for the whole app. expo-location only delivers updates while
  // the app is in the foreground, so there's nothing to pause on background.
  useEffect(() => {
    if (status !== 'granted') return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      // Show something straight away instead of waiting for the first movement.
      const last = await Location.getLastKnownPositionAsync();
      if (!cancelled && last) {
        setCoords({ lat: last.coords.latitude, lng: last.coords.longitude });
      }
      const sub = await Location.watchPositionAsync(
        highAccuracy ? NAVIGATING : BROWSING,
        (position) => setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
      );
      if (cancelled) sub.remove();
      else subscription = sub;
    })();
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [status, highAccuracy]);

  async function requestPermission() {
    if (status === 'blocked') {
      await Linking.openSettings();
      return;
    }
    setStatus(toStatus(await Location.requestForegroundPermissionsAsync()));
  }

  return (
    <LocationContext.Provider value={{ coords, status, requestPermission, setHighAccuracy }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
