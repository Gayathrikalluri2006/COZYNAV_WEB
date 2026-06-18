// OpenStreetMap Nominatim global geocoding (free, no key).
export type GeoResult = { lat: number; lng: number; display: string };

export async function geocode(query: string): Promise<GeoResult | null> {
  if (!query.trim()) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (!data.length) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display: data[0].display_name,
  };
}

// Autocomplete suggestions using Nominatim. Returns up to N candidate places.
export async function geocodeSuggest(query: string, limit = 6, lang = "en"): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=${limit}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "Accept-Language": lang } });
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  return data.map((d) => ({
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
    display: d.display_name,
  }));
}

// OSRM routing — returns multiple route alternatives globally.
export type RoutePath = {
  coordinates: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationMin: number;
};

export async function getRoutes(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): Promise<RoutePath[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?alternatives=true&overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.routes) return [];
  return data.routes.map(
    (r: { geometry: { coordinates: [number, number][] }; distance: number; duration: number }) => ({
      coordinates: r.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as [number, number],
      ),
      distanceKm: r.distance / 1000,
      durationMin: r.duration / 60,
    }),
  );
}
