import { Location, Route } from './types';

export async function getRoute(from: Location, to: Location): Promise<Route | null> {
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  const url = `/api/route?coords=${coords}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const osrmRoute = data.routes[0];
    // GeoJSON coords are [lng, lat] — swap to [lat, lng] for Leaflet
    const coordinates: [number, number][] = osrmRoute.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    return {
      coordinates,
      distance: osrmRoute.distance,
      duration: osrmRoute.duration,
    };
  } catch (err) {
    console.error('Routing error:', err);
    return null;
  }
}
