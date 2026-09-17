"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import lineSlice from "@turf/line-slice";
import { getRoute } from "@/lib/geocode";
import "mapbox-gl/dist/mapbox-gl.css";

type LatLng = { lat: number; lng: number };

const ROUTE_SOURCE_ID = "delivery-route";
const ROUTE_LAYER_ID = "delivery-route-line";

function popupLabel(text: string) {
  return `<span style="color:#191c1d;font-weight:600;font-size:13px;">${text}</span>`;
}

const MOVE_DURATION_MS = 1000;

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function animateMarkerTo(marker: mapboxgl.Marker, to: LatLng, frameRef: React.MutableRefObject<number | null>) {
  if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

  const from = marker.getLngLat();
  const start = performance.now();

  function step(now: number) {
    const t = Math.min(1, (now - start) / MOVE_DURATION_MS);
    const eased = easeInOutQuad(t);
    marker.setLngLat([
      from.lng + (to.lng - from.lng) * eased,
      from.lat + (to.lat - from.lat) * eased,
    ]);
    if (t < 1) {
      frameRef.current = requestAnimationFrame(step);
    } else {
      frameRef.current = null;
    }
  }
  frameRef.current = requestAnimationFrame(step);
}

type LiveTrackingMapProps = {
  pickup: LatLng;
  dropoff: LatLng | null;
  volunteer: LatLng | null;
};

export function LiveTrackingMap({ pickup, dropoff, volunteer }: LiveTrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const volunteerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const volunteerAnimationFrameRef = useRef<number | null>(null);
  const routeLineRef = useRef<GeoJSON.LineString | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [pickup.lng, pickup.lat],
      zoom: 12,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    new mapboxgl.Marker({ color: "#0f5132" })
      .setLngLat([pickup.lng, pickup.lat])
      .setPopup(new mapboxgl.Popup().setHTML(popupLabel("Pickup")))
      .addTo(map);

    if (dropoff) {
      new mapboxgl.Marker({ color: "#b9100b" })
        .setLngLat([dropoff.lng, dropoff.lat])
        .setPopup(new mapboxgl.Popup().setHTML(popupLabel("Dropoff")))
        .addTo(map);
    }

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([pickup.lng, pickup.lat]);
    if (dropoff) bounds.extend([dropoff.lng, dropoff.lat]);
    if (volunteer) bounds.extend([volunteer.lng, volunteer.lat]);
    map.fitBounds(bounds, { padding: 60, maxZoom: 15 });

    if (dropoff) {
      getRoute(pickup, dropoff).then((geometry) => {
        if (!geometry || !mapRef.current) return;
        routeLineRef.current = geometry;

        const addRouteLayer = () => {
          if (!mapRef.current || mapRef.current.getSource(ROUTE_SOURCE_ID)) return;
          mapRef.current.addSource(ROUTE_SOURCE_ID, {
            type: "geojson",
            data: geometry,
          });
          mapRef.current.addLayer({
            id: ROUTE_LAYER_ID,
            type: "line",
            source: ROUTE_SOURCE_ID,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#1a73e8", "line-width": 4 },
          });
        };

        if (map.isStyleLoaded()) addRouteLayer();
        else map.once("load", addRouteLayer);
      });
    }

    return () => {
      if (volunteerAnimationFrameRef.current !== null) {
        cancelAnimationFrame(volunteerAnimationFrameRef.current);
      }
      map.remove();
      mapRef.current = null;
      volunteerMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!volunteer) {
      if (volunteerAnimationFrameRef.current !== null) {
        cancelAnimationFrame(volunteerAnimationFrameRef.current);
        volunteerAnimationFrameRef.current = null;
      }
      volunteerMarkerRef.current?.remove();
      volunteerMarkerRef.current = null;
      return;
    }

    if (volunteerMarkerRef.current) {
      animateMarkerTo(volunteerMarkerRef.current, volunteer, volunteerAnimationFrameRef);
    } else {
      volunteerMarkerRef.current = new mapboxgl.Marker({ color: "#1a73e8" })
        .setLngLat([volunteer.lng, volunteer.lat])
        .setPopup(new mapboxgl.Popup().setHTML(popupLabel("Volunteer")))
        .addTo(map);
    }

    const line = routeLineRef.current;
    const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (line && source && dropoff) {
      const snapped = nearestPointOnLine(line, [volunteer.lng, volunteer.lat]);
      const remaining = lineSlice(snapped.geometry.coordinates, [dropoff.lng, dropoff.lat], line);
      source.setData(remaining);
    }
  }, [volunteer, dropoff]);

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-lg">
      <div ref={containerRef} className="h-full w-full" />
      {!volunteer && (
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-medium text-[#46464e] shadow-sm">
          Waiting for volunteer location…
        </div>
      )}
    </div>
  );
}
