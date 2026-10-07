import { Coordinates } from '@/types/task';

/**
 * Computes a center + zoom that fits a set of points, without relying on
 * mapbox-gl's fitBounds() — inside a WebView, fitBounds computes its camera
 * from the map canvas's current pixel size, and that size can still be stale
 * for a while after the container has visually settled to its final size
 * (independent of the map's own 'load' event or resize() calls), producing a
 * wildly wrong camera. A center/zoom picked from the raw coordinates and set
 * directly on map construction has no such dependency.
 *
 * `bottomInsetRatio` accounts for a persistent bottom sheet that visually
 * covers the lower portion of the map (e.g. 0.5 for a sheet covering half):
 * the map's own DOM container still spans the full area underneath it, so a
 * plain geometric center can land points behind the sheet even though they're
 * technically "in view". Extending the bounds further south before centering
 * shifts the visible cluster toward the top (uncovered) portion instead. This
 * is a fixed default bias, not a live one — the camera doesn't re-center as
 * the sheet is dragged, so it's tuned for its resting/default height.
 */
export function computeMapCamera(
  points: Coordinates[],
  bottomInsetRatio = 0
): { center: Coordinates; zoom: number } {
  if (points.length === 0) {
    return { center: { lat: -37.8136, lng: 144.9631 }, zoom: 12 };
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const span = Math.max(maxLat - minLat, maxLng - minLng, 0.0008);

  // In Mercator projection, smaller (more southerly) latitude always renders
  // lower on screen. Pushing minLat further south — without moving the real
  // points — pulls the computed midpoint north (up-screen), leaving room
  // below for whatever covers the bottom of the map.
  if (bottomInsetRatio > 0) {
    minLat -= span * (bottomInsetRatio / (1 - bottomInsetRatio));
  }

  const center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
  const effectiveSpan = Math.max(maxLat - minLat, maxLng - minLng, 0.0008);

  // Rough log2 fit: at zoom Z the visible span is ~360 / 2^Z degrees, so solve
  // for Z from the larger span, then back off a bit for padding.
  const zoom = Math.min(15, Math.max(11, Math.log2(360 / effectiveSpan) - 2));

  return { center, zoom };
}
