import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapRoute = {
  id: string;
  coordinates: [number, number][];
  score: number;
  active?: boolean;
};

export type MapIncident = {
  id: string;
  lat: number;
  lng: number;
  type: string;
  severity: number;
};

export function SafetyMap({
  routes = [],
  incidents = [],
  fit,
  center = [20, 0],
  zoom = 2,
}: {
  routes?: MapRoute[];
  incidents?: MapIncident[];
  fit?: boolean;
  center?: [number, number];
  zoom?: number;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView(
      center,
      zoom,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const colorFor = (s: number) =>
      s >= 80 ? "#5fd49a" : s >= 65 ? "#e6c558" : s >= 45 ? "#f0894a" : "#e85a4a";

    routes.forEach((r) => {
      const color = colorFor(r.score);
      L.polyline(r.coordinates, {
        color,
        weight: r.active ? 7 : 4,
        opacity: r.active ? 0.95 : 0.45,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layer);
      if (r.active) {
        L.polyline(r.coordinates, { color, weight: 14, opacity: 0.18 }).addTo(layer);
      }
    });

    incidents.forEach((i) => {
      const sevColor = i.severity >= 4 ? "#e85a4a" : i.severity >= 3 ? "#f0894a" : "#e6c558";
      L.circleMarker([i.lat, i.lng], {
        radius: 6 + i.severity,
        color: sevColor,
        fillColor: sevColor,
        fillOpacity: 0.45,
        weight: 2,
      })
        .addTo(layer)
        .bindPopup(`<b>${i.type}</b><br/>Severity ${i.severity}/5`);
    });

    if (fit && routes.length) {
      const all = routes.flatMap((r) => r.coordinates);
      if (all.length) map.fitBounds(L.latLngBounds(all as L.LatLngTuple[]), { padding: [40, 40] });
    }
  }, [routes, incidents, fit]);

  return <div ref={mapEl} className="h-full w-full" style={{ minHeight: 400 }} />;
}
