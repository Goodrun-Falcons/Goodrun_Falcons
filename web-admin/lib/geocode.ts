export type Coordinates = { lat: number; lng: number };

/**
 * Not implemented yet — swap in Mapbox's geocoding API here once the API key
 * is set up. Until then, callers should catch the rejection and tell the
 * user address lookup isn't available rather than inserting a bad location.
 */
export async function geocodeAddress(_address: string): Promise<Coordinates> {
  throw new Error("Address lookup is not set up yet (Mapbox integration pending).");
}
