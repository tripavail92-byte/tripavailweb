/**
 * Google Maps Configuration
 * API key should be set in environment variables
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
 */

export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const GOOGLE_MAPS_LIBRARIES: string[] = ['places'];

export const DEFAULT_MAP_CENTER = {
  lat: 20.5937,
  lng: 78.9629,
};

export const DEFAULT_MAP_ZOOM = 10;

export const MAP_OPTIONS = {
  zoom: DEFAULT_MAP_ZOOM,
  center: DEFAULT_MAP_CENTER,
  mapTypeId: 'roadmap',
  streetViewControl: false,
  fullscreenControl: true,
  mapTypeControl: true,
};

// Marker icon function (called after Google Maps loads)
export const getMarkerIcon = () => {
  if (typeof google === 'undefined' || !google.maps) {
    return undefined;
  }
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: '#4285F4',
    fillOpacity: 0.8,
    strokeColor: '#fff',
    strokeWeight: 2,
  };
};

/**
 * Validate if Google Maps API is configured
 */
export function isGoogleMapsConfigured(): boolean {
  return Boolean(GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.trim());
}

/**
 * Get Google Maps script URL with API key
 */
export function getGoogleMapsScriptUrl(): string {
  const libs = encodeURIComponent(Array.from(GOOGLE_MAPS_LIBRARIES).join(','));
  return `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${libs}`;
}
