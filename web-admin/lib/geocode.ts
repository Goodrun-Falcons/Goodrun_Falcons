export type Coordinates = { lat: number; lng: number };

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export async function geocodeAddress(address: string): Promise<Coordinates> {
  if (!MAPBOX_TOKEN) {
    throw new Error("Address lookup is not set up yet (Mapbox integration pending).");
  }

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", address);
  url.searchParams.set("limit", "1");
  url.searchParams.set("access_token", MAPBOX_TOKEN);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Address lookup failed. Please try again.");
  }

  const data = await response.json();
  const feature = data.features?.[0];
  if (!feature) {
    throw new Error(`Couldn't find that address: "${address}". Try a more specific address.`);
  }

  const [lng, lat] = feature.geometry.coordinates;
  return { lat, lng };
}

export type AddressSuggestion = {
  id: string;
  fullAddress: string;
  coordinates: Coordinates;
};

type MapboxFeature = {
  id?: string;
  geometry: { coordinates: [number, number] };
  properties?: { mapbox_id?: string; full_address?: string; place_formatted?: string };
};

export async function suggestAddresses(
  query: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  if (!MAPBOX_TOKEN || query.trim().length < 3) return [];

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");
  url.searchParams.set("access_token", MAPBOX_TOKEN);

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) return [];

  const data = await response.json();
  return ((data.features ?? []) as MapboxFeature[]).map((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    return {
      id: feature.properties?.mapbox_id ?? feature.id ?? `${lng},${lat}`,
      fullAddress: feature.properties?.full_address ?? feature.properties?.place_formatted ?? query,
      coordinates: { lat, lng },
    };
  });
}

export async function getRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<GeoJSON.LineString | null> {
  if (!MAPBOX_TOKEN) return null;

  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`);
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("access_token", MAPBOX_TOKEN);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const data = await response.json();
  return data.routes?.[0]?.geometry ?? null;
}
