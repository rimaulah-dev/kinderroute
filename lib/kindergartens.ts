import { Kindergarten, Route } from './types';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function toRadians(deg: number): number {
  return deg * (Math.PI / 180);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Minimum distance in km from a point to a polyline segment.
 * route.coordinates are [lat, lng] pairs.
 */
function distanceFromRouteKm(lat: number, lon: number, route: Route): number {
  const coords = route.coordinates; // each is [lat, lng]
  if (coords.length === 0) return Infinity;
  if (coords.length === 1) return haversineKm(lat, lon, coords[0][0], coords[0][1]);

  let minDist = Infinity;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + 1];

    // Project point onto segment in lat/lon space (approximate but fine for small distances)
    const dx = lat2 - lat1;
    const dy = lon2 - lon1;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = ((lat - lat1) * dx + (lon - lon1) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const closestLat = lat1 + t * dx;
    const closestLon = lon1 + t * dy;
    const d = haversineKm(lat, lon, closestLat, closestLon);
    if (d < minDist) minDist = d;
  }

  return minDist;
}

/**
 * Build a bounding box from the route polyline + padding in km.
 */
function routeBbox(route: Route, paddingKm: number): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
  const coords = route.coordinates;
  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const [lat, lon] of coords) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  const latPad = paddingKm / 111;
  const lonPad = paddingKm / (111 * Math.cos(toRadians((minLat + maxLat) / 2)));
  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLon: minLon - lonPad,
    maxLon: maxLon + lonPad,
  };
}

export async function searchKindergartensAlongRoute(
  route: Route,
  maxDistanceMetres: number = 500,
  options?: { signal?: AbortSignal }
): Promise<Kindergarten[]> {
  // Use route bbox + padding based on selected distance (minimum 2km)
  const paddingKm = Math.max(2, maxDistanceMetres / 1000);
  const bbox = routeBbox(route, paddingKm);

  const query = `[out:json][timeout:20];
(
  node["amenity"="kindergarten"](${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon});
  way["amenity"="kindergarten"](${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon});
  node["amenity"="school"]["school:type"="kindergarten"](${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon});
  node["amenity"="school"]["isced:level"="0"](${bbox.minLat},${bbox.minLon},${bbox.maxLat},${bbox.maxLon});
);
out center;`;

  // Call our server-side proxy to avoid CORS issues
  const response = await fetch('/api/overpass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal: options?.signal ?? AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Overpass proxy failed: ${response.status} ${errText}`);
  }

  const data: { elements?: OverpassElement[] } = await response.json();
  console.log('[Overpass] Proxy success, elements:', data?.elements?.length ?? 0);

  const elements: OverpassElement[] = data.elements || [];

  console.log(`[Overpass] Found ${elements.length} elements in bbox`);
  if (elements.length > 0) {
    console.log('[Overpass] First 3 elements:', elements.slice(0, 3).map(el => ({
      type: el.type,
      id: el.id,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
      name: el.tags?.name
    })));
  }

  const kindergartens: Kindergarten[] = [];

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) {
      console.log(`[Overpass] Skipping element ${el.type}-${el.id}: no coordinates`);
      continue;
    }

    const distKm = distanceFromRouteKm(lat, lon, route);

    // Include all found (we'll filter by slider in the UI)
    const name =
      el.tags?.name ||
      el.tags?.['name:en'] ||
      el.tags?.['name:ms'] ||
      'Unnamed Kindergarten';

    const address = [
      el.tags?.['addr:housenumber'],
      el.tags?.['addr:street'],
      el.tags?.['addr:city'],
    ]
      .filter(Boolean)
      .join(', ');

    kindergartens.push({
      id: `${el.type}-${el.id}`,
      name,
      lat,
      lon,
      distanceFromRoute: distKm,
      address: address || undefined,
      tags: el.tags,
      // OSM enrichment
      phone: el.tags?.['contact:phone'] || el.tags?.['phone'] || undefined,
      website: el.tags?.['website'] || el.tags?.['contact:website'] || el.tags?.['url'] || undefined,
      openingHours: el.tags?.['opening_hours'] || undefined,
      operator: el.tags?.['operator'] || undefined,
      fee: el.tags?.['fee'] || el.tags?.['fee:conditional'] || undefined,
      wheelchair: el.tags?.['wheelchair'] || undefined,
      email: el.tags?.['email'] || el.tags?.['contact:email'] || undefined,
    });
  }

  // Sort by distance from route
  kindergartens.sort((a, b) => a.distanceFromRoute - b.distanceFromRoute);

  console.log(`[Kindergartens] Processed ${kindergartens.length} kindergartens`);
  if (kindergartens.length > 0) {
    console.log('[Kindergartens] Top 5 by distance (in km):', kindergartens.slice(0, 5).map(k => ({
      name: k.name,
      distanceFromRoute: k.distanceFromRoute
    })));
  }

  return kindergartens;
}
