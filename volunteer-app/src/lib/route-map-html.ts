import { BrandColors } from '@/constants/theme';
import { computeMapCamera } from '@/lib/map-camera';
import { Coordinates } from '@/types/task';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_GL_VERSION = '3.9.0';
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

export type RouteMarkerStatus = 'pending' | 'active' | 'done';

export type RouteMarker = {
  coords: Coordinates;
  /** Text shown inside the marker — a stop number, or a checkmark once done. */
  label: string;
  status: RouteMarkerStatus;
};

const STATUS_COLOR: Record<RouteMarkerStatus, string> = {
  pending: BrandColors.navy,
  active: BrandColors.red,
  done: '#8a8d99',
};

/**
 * Builds a self-contained HTML page (mapbox-gl.js from the CDN, same approach as
 * interactive-map-html.ts) showing a route line between numbered stops. `dashed`
 * mirrors the trip's active/inactive state, matching the Figma reference.
 */
export function buildRouteMapHtml(markers: RouteMarker[], dashed: boolean): string | null {
  if (!MAPBOX_TOKEN) return null;

  // The bottom sheet on the My Route screen rests at ~52% of the map area's
  // height; bias a bit past that so markers clear the sheet's rounded top edge.
  const { center, zoom } = computeMapCamera(
    markers.map((m) => m.coords),
    0.62
  );
  const markersJson = JSON.stringify(markers).replace(/</g, '\\u003c');
  const lineCoordsJson = JSON.stringify(markers.map((m) => [m.coords.lng, m.coords.lat]));

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
    <link href="https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.css" rel="stylesheet" />
    <script src="https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_GL_VERSION}/mapbox-gl.js"></script>
    <style>
      html, body { margin: 0; padding: 0; background: #141a43; }
      #map { position: fixed; inset: 0; }
      .mapboxgl-ctrl-logo { opacity: 0.6; }
      .stop-marker {
        width: 26px; height: 26px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: #ffffff; font-family: -apple-system, sans-serif; font-weight: 700; font-size: 12px;
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 1px 4px rgba(0,0,0,0.45);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      mapboxgl.accessToken = '${MAPBOX_TOKEN}';
      const map = new mapboxgl.Map({
        container: 'map',
        style: '${MAPBOX_STYLE}',
        center: [${center.lng}, ${center.lat}],
        zoom: ${zoom},
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        map.addSource('route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: ${lineCoordsJson} } },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '${BrandColors.red}',
            'line-width': 3,
            'line-opacity': 0.85,
            ${dashed ? "'line-dasharray': [1.5, 1.5]," : ''}
          },
        });

        const markers = ${markersJson};
        const statusColor = ${JSON.stringify(STATUS_COLOR)};
        markers.forEach((m) => {
          const el = document.createElement('div');
          el.className = 'stop-marker';
          el.style.background = statusColor[m.status];
          el.textContent = m.label;
          new mapboxgl.Marker({ element: el }).setLngLat([m.coords.lng, m.coords.lat]).addTo(map);
        });
      });

      // The WebView can report a stale/incorrect size to mapbox-gl for a while
      // after first paint (its native container settles asynchronously), so
      // keep the canvas synced to the #map element's actual size for as long
      // as the page is open. The initial camera is set directly from the
      // marker coordinates above (see map-camera.ts) rather than via
      // fitBounds(), since fitBounds computes its camera from the canvas's
      // current pixel size and doesn't get corrected by a later resize().
      new ResizeObserver(() => map.resize()).observe(document.getElementById('map'));
    </script>
  </body>
</html>`;
}
