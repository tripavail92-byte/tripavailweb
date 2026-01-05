'use client';

import React, { useRef, useState, useEffect } from 'react';
import { DEFAULT_MAP_CENTER } from '@/lib/google-maps-config';

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationAutocompleteProps {
  value?: string;
  onLocationSelect: (location: Location) => void;
  onAddressChange?: (address: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Google Places Autocomplete component for location input
 * Provides real-time address suggestions and geocoding
 */
export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value = '',
  onLocationSelect,
  onAddressChange,
  placeholder = 'Search location...',
  className = '',
  required = false,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  // Initialize Autocomplete service
  useEffect(() => {
    if (typeof google !== 'undefined' && google.maps) {
      autocompleteRef.current = new google.maps.places.AutocompleteService();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onAddressChange?.(value);

    if (value.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Get predictions from Google Places
    if (autocompleteRef.current) {
      autocompleteRef.current.getPlacePredictions(
        {
          input: value,
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(DEFAULT_MAP_CENTER.lat - 5, DEFAULT_MAP_CENTER.lng - 5),
            new google.maps.LatLng(DEFAULT_MAP_CENTER.lat + 5, DEFAULT_MAP_CENTER.lng + 5),
          ),
          componentRestrictions: { country: 'in' },
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
            setShowPredictions(true);
          } else {
            setPredictions([]);
          }
        },
      );
    }
  };

  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    const address = prediction.description;
    setInputValue(address);
    onAddressChange?.(address);
    setPredictions([]);
    setShowPredictions(false);

    // Get coordinates for the selected place
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results?.[0]?.geometry?.location) {
        const location = results[0].geometry.location;
        onLocationSelect({
          lat: location.lat(),
          lng: location.lng(),
          address,
        });
      }
    });
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => predictions.length > 0 && setShowPredictions(true)}
        onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        } ${className}`}
        autoComplete="off"
      />

      {showPredictions && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          {predictions.map((prediction) => (
            <div
              key={prediction.place_id}
              onClick={() => handleSelectPrediction(prediction)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-200 last:border-b-0"
            >
              <p className="text-sm font-medium text-gray-900">{prediction.description}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{prediction.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
