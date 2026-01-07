'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/google-maps-config';

interface MapLocation {
  lat: number;
  lng: number;
  label?: string;
  address?: string;
}

interface LocationMapProps {
  location?: MapLocation;
  onLocationSelect?: (location: MapLocation) => void;
  isSelectable?: boolean;
  zoom?: number;
  center?: { lat: number; lng: number };
  height?: string;
  markerColor?: string;
  showInfoWindow?: boolean;
}

/**
 * Interactive Google Map component for location selection and display
 * Supports marker placement, address lookup, and location selection
 */
export const LocationMap: React.FC<LocationMapProps> = ({
  location,
  onLocationSelect,
  isSelectable = false,
  zoom = DEFAULT_MAP_ZOOM,
  center = DEFAULT_MAP_CENTER,
  height = '400px',
  markerColor = '#4285F4',
  showInfoWindow = true,
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | undefined>(location);
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState(location || center);
  // Derive display values from prop if provided (avoid setState in effects)
  const displayLocation = location ?? selectedLocation;
  const displayCenter = location ? { lat: location.lat, lng: location.lng } : mapCenter;

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!isSelectable || !onLocationSelect || !e.latLng) return;

      const newLocation: MapLocation = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
        label: 'Selected Location',
      };

      setSelectedLocation(newLocation);
      setMapCenter({ lat: newLocation.lat, lng: newLocation.lng });
      setInfoWindowOpen(true);
      onLocationSelect(newLocation);
    },
    [isSelectable, onLocationSelect],
  );

  const handleMarkerClick = useCallback(() => {
    setInfoWindowOpen(!infoWindowOpen);
  }, [infoWindowOpen]);

  const mapContainerStyle: React.CSSProperties = {
    width: '100%',
    height,
  };

  return (
    <div className="w-full rounded-lg border border-gray-300 overflow-hidden shadow-md">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={displayCenter}
        zoom={zoom}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onClick={handleMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: true,
        } as any}
      >
        {displayLocation && (
          <>
            <Marker
              position={{ lat: displayLocation.lat, lng: displayLocation.lng }}
              onClick={handleMarkerClick}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: markerColor,
                fillOpacity: 0.9,
                strokeColor: '#fff',
                strokeWeight: 2,
              }}
              title={displayLocation.label || 'Location'}
            />
            {showInfoWindow && infoWindowOpen && (
              <InfoWindow
                position={{ lat: displayLocation.lat, lng: displayLocation.lng }}
                onCloseClick={() => setInfoWindowOpen(false)}
              >
                <div className="p-3 min-w-[200px]">
                  <p className="font-semibold text-sm">{displayLocation.label || 'Location'}</p>
                  {displayLocation.address && (
                    <p className="text-xs text-gray-600 mt-1">{displayLocation.address}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {displayLocation.lat.toFixed(6)}, {displayLocation.lng.toFixed(6)}
                  </p>
                  {isSelectable && (
                    <p className="text-xs text-blue-600 mt-2 italic">Click to change location</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </>
        )}
      </GoogleMap>

      {isSelectable && (
        <div className="bg-blue-50 border-t border-gray-300 p-3">
          <p className="text-xs text-gray-600">
            {displayLocation ? (
              <>
                📍 {displayLocation.lat.toFixed(6)}, {displayLocation.lng.toFixed(6)}
              </>
            ) : (
              'Click on the map to select a location'
            )}
          </p>
        </div>
      )}
    </div>
  );
};
