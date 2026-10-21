import { Coordinates } from '@/types/task';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export function buildReverseGeocodeUrl(coords: Coordinates, token: string): string {
  return (
    `https://api.mapbox.com/search/geocode/v6/reverse` +
    `?longitude=${coords.lng}&latitude=${coords.lat}&limit=1&access_token=${token}`
  );
}

/**
 * The street address from a Geocoding v6 reverse response, e.g. "12 Smith St, Fitzroy VIC
 * 3065" — the country is dropped, every run is local. Null for an error or no match.
 */
export function parseAddress(body: unknown): string | null {
  const { features } = (body ?? {}) as {
    features?: {
      properties?: {
        name?: string;
        full_address?: string;
        place_formatted?: string;
        context?: { country?: { name?: string } };
      };
    }[];
  };
  const properties = features?.[0]?.properties;
  if (!properties) return null;
  const full =
    properties.full_address ??
    [properties.name, properties.place_formatted].filter(Boolean).join(', ');
  const country = properties.context?.country?.name;
  const address = country ? full.replace(new RegExp(`,\\s*${country}$`), '') : full;
  return address.trim() || null;
}

// A coordinate only ever resolves to one address, and the same pickup shows on Home,
// Nearby and My Route, so look each up once. ~11 m precision keeps near-identical points
// together. Failures aren't kept, so the next render can try again.
const cache = new Map<string, Promise<string | null>>();

/** The address at `coords`, or null if there's no token, no match, or the request failed. */
export function fetchAddress(coords: Coordinates): Promise<string | null> {
  if (!MAPBOX_TOKEN) return Promise.resolve(null);
  const key = `${coords.lat.toFixed(4)},${coords.lng.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const lookup = fetch(buildReverseGeocodeUrl(coords, MAPBOX_TOKEN))
    .then((response) => (response.ok ? response.json().then(parseAddress) : null))
    .catch(() => null)
    .then((address) => {
      if (address === null) cache.delete(key);
      return address;
    });
  cache.set(key, lookup);
  return lookup;
}
