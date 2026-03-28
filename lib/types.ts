export interface Location {
  lat: number;
  lon: number;
  display_name?: string;
}

export interface Kindergarten {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distanceFromRoute: number;  // distance from route in km
  address?: string;
  tags?: Record<string, string>;
  // OSM-derived fields
  phone?: string;
  website?: string;
  openingHours?: string;
  operator?: string;
  fee?: string;
  wheelchair?: string;
  email?: string;
  // Google Places fields (loaded lazily)
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  isOpenNow?: boolean;
  placesLoaded?: boolean;
  featured?: boolean;  // paid featured placement
}

export interface Route {
  coordinates: [number, number][];  // [lat, lng] pairs
  distance: number;   // in metres
  duration: number;   // in seconds
}
