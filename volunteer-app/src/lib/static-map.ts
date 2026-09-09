import { BrandColors } from '@/constants/theme';
import { Coordinates } from '@/types/task';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

const MAPBOX_STYLE = 'mapbox/dark-v11';

function pin(color: string, points: Coordinates[]): string {
  const hex = color.slice(1);
  return points.map((p) => `pin-s+${hex}(${p.lng},${p.lat})`).join(',');
}

/**
 * Builds a Mapbox Static Images URL showing the warehouse and a set of task locations.
 * Returns null when no token is configured (EXPO_PUBLIC_MAPBOX_TOKEN),
 * so callers can show a fallback instead of a broken image request.
 */
export function buildTaskMapUrl(
  warehouse: Coordinates,
  urgentPoints: Coordinates[],
  otherPoints: Coordinates[],
  size: { width: number; height: number }
): string | null {
  if (!MAPBOX_TOKEN) return null;

  const markers = [
    pin(BrandColors.white, [warehouse]),
    pin('#8a8d99', otherPoints),
    pin(BrandColors.red, urgentPoints),
  ]
    .filter(Boolean)
    .join(',');

  return (
    `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/${markers}/auto/` +
    `${size.width}x${size.height}@2x?padding=30&access_token=${MAPBOX_TOKEN}`
  );
}
