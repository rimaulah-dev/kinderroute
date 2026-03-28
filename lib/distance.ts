import { Location } from './types';

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(point2.lat - point1.lat);
  const dLon = toRadians(point2.lon - point1.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate the minimum distance from a point to a line segment
 * Returns distance in kilometers
 */
function pointToSegmentDistance(point: Location, segmentStart: Location, segmentEnd: Location): number {
  const A = point.lat - segmentStart.lat;
  const B = point.lon - segmentStart.lon;
  const C = segmentEnd.lat - segmentStart.lat;
  const D = segmentEnd.lon - segmentStart.lon;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let closestPoint: Location;

  if (param < 0) {
    closestPoint = segmentStart;
  } else if (param > 1) {
    closestPoint = segmentEnd;
  } else {
    closestPoint = {
      lat: segmentStart.lat + param * C,
      lon: segmentStart.lon + param * D,
    };
  }

  return haversineDistance(point, closestPoint);
}

/**
 * Calculate the minimum distance from a point to a polyline (route)
 * Returns distance in kilometers
 */
export function pointToLineDistance(point: Location, route: Location[]): number {
  if (route.length === 0) return Infinity;
  if (route.length === 1) return haversineDistance(point, route[0]);

  let minDistance = Infinity;

  for (let i = 0; i < route.length - 1; i++) {
    const distance = pointToSegmentDistance(point, route[i], route[i + 1]);
    minDistance = Math.min(minDistance, distance);
  }

  return minDistance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
