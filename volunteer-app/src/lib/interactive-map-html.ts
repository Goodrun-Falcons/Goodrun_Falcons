import { computeMapCamera } from '@/lib/map-camera';
import { Coordinates } from '@/types/task';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const MAPBOX_GL_VERSION = '3.9.0';
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

export type MapMarker = Coordinates & { color: string; id?: string };

/**
 * Builds a self-contained HTML page that loads mapbox-gl.js from the CDN and
 * renders a pannable/zoomable map with one marker per point — for use inside
 * a WebView, since we don't ship a native Mapbox SDK (no Expo Go dev-client
 * rebuild required). Returns null when no token is configured, so callers
 * can show a fallback instead of a broken map.
 */
export function buildInteractiveMapHtml(markers: MapMarker[]): string | null {
  if (!MAPBOX_TOKEN) return null;

  // The draggable bottom sheet on the Nearby screen rests at ~46% of the map
  // area's height by default (see SHEET_DEFAULT_RATIO in nearby.tsx).
  const { center, zoom } = computeMapCamera(markers, 0.46);
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
        zoom: ${zoom},
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        const markers = ${markersJson};
        markers.forEach((m) => {
          const el = document.createElement('div');
          el.style.width = '16px';
          el.style.height = '16px';
          el.style.borderRadius = '50%';
          el.style.background = m.color;
          el.style.border = '2px solid rgba(0,0,0,0.3)';
          el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.45)';
          if (m.id) {
            el.style.cursor = 'pointer';
            el.addEventListener('click', (event) => {
              event.stopPropagation();
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
              }
            });
          }
          new mapboxgl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
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
