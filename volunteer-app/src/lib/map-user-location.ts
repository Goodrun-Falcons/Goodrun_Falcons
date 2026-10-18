import { Coordinates } from '@/types/task';

/**
 * Shared pieces for the mapbox-gl WebView pages (interactive-map-html.ts and
 * route-map-html.ts) that show the volunteer's own position.
 *
 * The position isn't baked into the page HTML: it changes far more often than
 * anything else on the map, and a new HTML string reloads the whole WebView.
 * Instead each page posts `{ type: 'ready' }` once its script has run, and the
 * native side calls `window.setUserLocation(lng, lat)` via injectJavaScript
 * (see use-map-scripts.ts).
 */

export const USER_LOCATION_CSS = `
      .user-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #3b82f6;
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.25), 0 1px 4px rgba(0, 0, 0, 0.45);
        /* Other markers may be added on 'load', after this one — stay on top. */
        z-index: 1;
      }
      .locate-button svg { display: block; margin: auto; }`;

/**
 * Defines `window.setUserLocation` and a "show my location" control (hidden until
 * there's a position). Expects a `map` variable in scope. `bottomInsetRatio` is the
 * share of the map covered by the screen's bottom sheet, so recentering keeps the
 * dot above it.
 */
export function userLocationScript(bottomInsetRatio: number): string {
  return `
      let userMarker = null;
      let userLngLat = null;

      const locateControl = {
        onAdd() {
          const container = document.createElement('div');
          container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
          container.style.display = 'none';
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'locate-button';
          button.setAttribute('aria-label', 'Show my location');
          button.innerHTML =
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2">' +
            '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>';
          button.addEventListener('click', () => {
            if (!userLngLat) return;
            map.easeTo({
              center: userLngLat,
              zoom: Math.max(map.getZoom(), 13),
              padding: { bottom: window.innerHeight * ${bottomInsetRatio} },
            });
          });
          container.appendChild(button);
          this.container = container;
          return container;
        },
        onRemove() {
          this.container.remove();
        },
      };
      map.addControl(locateControl, 'top-right');

      window.setUserLocation = (lng, lat) => {
        userLngLat = [lng, lat];
        if (userMarker) {
          userMarker.setLngLat(userLngLat);
          return;
        }
        const el = document.createElement('div');
        el.className = 'user-dot';
        userMarker = new mapboxgl.Marker({ element: el }).setLngLat(userLngLat).addTo(map);
        locateControl.container.style.display = '';
      };`;
}

/** Posted last, so everything the native side may call already exists. */
export const READY_SCRIPT = `
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      }`;

export function setUserLocationCall(coords: Coordinates | null | undefined): string | null {
  return coords ? `window.setUserLocation(${coords.lng}, ${coords.lat})` : null;
}
