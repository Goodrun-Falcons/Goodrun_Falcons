import { Coordinates } from '@/types/task';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_GL_VERSION = '3.9.0';
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

export type MapMarker = Coordinates & { color: string };

/**
 * Builds a self-contained HTML page that loads mapbox-gl.js from the CDN and
 * renders a pannable/zoomable map with one marker per point — for use inside
 * a WebView, since we don't ship a native Mapbox SDK (no Expo Go dev-client
 * rebuild required). Returns null when no token is configured, so callers
 * can show a fallback instead of a broken map.
 */
export function buildInteractiveMapHtml(markers: MapMarker[]): string | null {
  if (!MAPBOX_TOKEN) return null;

  const center = markers[0] ?? { lat: -37.8136, lng: 144.9631 };
  const markersJson = JSON.stringify(markers).replace(/</g, '\\u003c');

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
        zoom: 12,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      // The WebView can report a stale/incorrect size to mapbox-gl on first paint
      // (its native container settles asynchronously), so keep the canvas synced
      // to the #map element's actual size for as long as the page is open.
      map.on('load', () => map.resize());
      new ResizeObserver(() => map.resize()).observe(document.getElementById('map'));

      const markers = ${markersJson};
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach((m) => {
        const el = document.createElement('div');
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.background = m.color;
        el.style.border = '2px solid rgba(0,0,0,0.3)';
        el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.45)';
        new mapboxgl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
        bounds.extend([m.lng, m.lat]);
      });
      if (markers.length > 1) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
      }
    </script>
  </body>
</html>`;
}
