'use client';

import React, { useEffect } from 'react';
import { LoadScript } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, isGoogleMapsConfigured } from '@/lib/google-maps-config';

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component to load Google Maps API globally
 * Wraps all components that use Google Maps functionality
 */
export const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  useEffect(() => {
    if (!isGoogleMapsConfigured()) {
      console.warn(
        'Google Maps API key is not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.',
      );
    }
  }, []);

  if (!isGoogleMapsConfigured()) {
    return <>{children}</>;
  }

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
      {children}
    </LoadScript>
  );
};
