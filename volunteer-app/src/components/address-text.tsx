import { useEffect, useState } from 'react';

import { ThemedText, type ThemedTextProps } from '@/components/themed-text';
import { fetchAddress } from '@/lib/mapbox-geocode';
import { Coordinates } from '@/types/task';

type AddressTextProps = Omit<ThemedTextProps, 'children'> & {
  coords: Coordinates;
  /** Shown until (or instead of, if the lookup fails) the street address. */
  fallback: string;
};

/** Text showing the street address at `coords`, looked up through Mapbox. */
export function AddressText({ coords, fallback, ...rest }: AddressTextProps) {
  const [address, setAddress] = useState<string | null>(null);
  const { lat, lng } = coords;

  useEffect(() => {
    let cancelled = false;
    fetchAddress({ lat, lng }).then((found) => {
      if (!cancelled) setAddress(found);
    });
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return <ThemedText {...rest}>{address ?? fallback}</ThemedText>;
}
