import { Location } from './types';
type GeocodeOptions = { signal?: AbortSignal };

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'AbortError';

/**
 * Geocode using Photon (photon.komoot.io) — better coverage for Malaysian addresses
 * Returns coordinates biased toward Malaysia
 */
async function geocodeWithPhoton(query: string, options?: GeocodeOptions): Promise<Location | null> {
  try {
    // Bias results toward Malaysia (lat=3.1, lon=101.7)
    const url = `/api/geocode?q=${encodeURIComponent(query)}&limit=1&lang=en&lat=3.1&lon=101.7`;
    const res = await fetch(url, {
      signal: options?.signal ?? AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const features = data?.features;
    if (!features || features.length === 0) return null;

    const [lon, lat] = features[0].geometry.coordinates;
    const props = features[0].properties;
    const display = [props.name, props.street, props.city, props.country]
      .filter(Boolean)
      .join(', ');

    return { lat, lon, display_name: display };
  } catch (error) {
    if (isAbortError(error)) throw error;
    return null;
  }
}

/**
 * Geocode using Nominatim (OpenStreetMap)
 */
async function geocodeWithNominatim(query: string, options?: GeocodeOptions): Promise<Location | null> {
  try {
    const url = `/api/nominatim?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=my`;
    const res = await fetch(url, {
      signal: options?.signal ?? AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;

    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      display_name: data[0].display_name,
    };
  } catch (error) {
    if (isAbortError(error)) throw error;
    return null;
  }
}

/**
 * Geocode an address — tries Photon first, then Nominatim as fallback.
 * Validates result is within Malaysia bounding box.
 */
export async function geocodeAddress(query: string, options?: GeocodeOptions): Promise<Location | null> {
  // Malaysia bounding box (rough)
  const inMalaysia = (lat: number, lon: number) =>
    lat >= 0.8 && lat <= 7.4 && lon >= 99.6 && lon <= 119.3;

  // Try Photon first
  const photonResult = await geocodeWithPhoton(query, options);
  if (photonResult && inMalaysia(photonResult.lat, photonResult.lon)) {
    return photonResult;
  }

  // Try Photon without country bias
  try {
    const url = `/api/geocode?q=${encodeURIComponent(query + ' Malaysia')}&limit=1&lang=en&lat=3.1&lon=101.7`;
    const res = await fetch(url, {
      signal: options?.signal ?? AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      const features = data?.features;
      if (features && features.length > 0) {
        const [lon, lat] = features[0].geometry.coordinates;
        if (inMalaysia(lat, lon)) {
          const props = features[0].properties;
          const display = [props.name, props.street, props.city, props.country].filter(Boolean).join(', ');
          return { lat, lon, display_name: display };
        }
      }
    }
  } catch (error) {
    if (isAbortError(error)) throw error;
    /* fall through */
  }

  // Fallback to Nominatim
  const nominatimResult = await geocodeWithNominatim(query, options);
  if (nominatimResult && inMalaysia(nominatimResult.lat, nominatimResult.lon)) {
    return nominatimResult;
  }

  // Last resort: Nominatim without country filter
  try {
    const url = `/api/nominatim?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, {
      signal: options?.signal ?? AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (inMalaysia(lat, lon)) {
          return { lat, lon, display_name: data[0].display_name };
        }
      }
    }
  } catch (error) {
    if (isAbortError(error)) throw error;
    /* give up */
  }

  return null;
}
