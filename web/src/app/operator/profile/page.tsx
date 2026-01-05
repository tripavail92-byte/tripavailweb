'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateOperatorProfile, getOperatorProfile } from '@/lib/api-client';
import { LocationMap } from '@/components/LocationMap';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

interface OperatorProfile {
  id: string;
  providerId: string;
  baseCity?: string;
  baseLatitude?: number;
  baseLongitude?: number;
  meetingPoint?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OperatorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form state
  const [baseCity, setBaseCity] = useState('');
  const [baseLatitude, setBaseLatitude] = useState('');
  const [baseLongitude, setBaseLongitude] = useState('');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const operatorProfile = user?.profiles?.find((p) => p.providerType === 'TOUR_OPERATOR');
  const providerId = operatorProfile?.id;

  useEffect(() => {
    if (!providerId) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = (await getOperatorProfile(providerId)) as OperatorProfile;
        setProfile(data);
        setBaseCity(data.baseCity || '');
        setBaseLatitude(data.baseLatitude?.toString() || '');
        setBaseLongitude(data.baseLongitude?.toString() || '');
        setMeetingPoint(data.meetingPoint || '');
        setContactPhone(data.contactPhone || '');
        if (data.baseLatitude && data.baseLongitude) {
          setSelectedLocation({
            lat: data.baseLatitude,
            lng: data.baseLongitude,
            address: data.meetingPoint,
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load profile';
        setMessage(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId) return;

    try {
      setSaving(true);
      setMessage(null);

      const payload: any = {};

      // Only include fields that have changed or are not empty
      if (baseCity !== (profile?.baseCity || '')) payload.baseCity = baseCity || null;
      if (baseLatitude !== (profile?.baseLatitude?.toString() || '')) {
        payload.baseLatitude = baseLatitude ? parseFloat(baseLatitude) : null;
      }
      if (baseLongitude !== (profile?.baseLongitude?.toString() || '')) {
        payload.baseLongitude = baseLongitude ? parseFloat(baseLongitude) : null;
      }
      if (meetingPoint !== (profile?.meetingPoint || '')) payload.meetingPoint = meetingPoint || null;
      if (contactPhone !== (profile?.contactPhone || '')) payload.contactPhone = contactPhone || null;

      const updated = (await updateOperatorProfile(providerId, payload)) as OperatorProfile;
      setProfile(updated);
      setMessage('Profile updated successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update profile';
      setMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number; address?: string }) => {
    setSelectedLocation(location);
    setBaseLatitude(location.lat.toString());
    setBaseLongitude(location.lng.toString());
    if (location.address) {
      setMeetingPoint(location.address);
    }
    setShowMapModal(false);
  };

  const handleAddressChange = (address: string) => {
    setMeetingPoint(address);
  };

  if (!operatorProfile) {
    return (
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <p className="text-neutral-600">You need to be a tour operator to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold">Operator Profile</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage your tour operator base location, meeting points, and contact information.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="space-y-6">
          {/* Base Location Section */}
          <div className="border-b pb-6">
            <h2 className="mb-4 text-lg font-semibold">Base Location</h2>

            {/* Map Display */}
            {selectedLocation && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-neutral-900">Location Preview</p>
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                  <p className="text-sm text-neutral-700">
                    📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                  {selectedLocation.address && (
                    <p className="mt-1 text-sm text-neutral-600">{selectedLocation.address}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-900">Base City</label>
              <input
                type="text"
                value={baseCity}
                onChange={(e) => setBaseCity(e.target.value)}
                placeholder="e.g., Bangkok"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-neutral-500">The primary city where you operate tours</p>
            </div>
          </div>

          {/* Meeting Point Section */}
          <div className="border-b pb-6">
            <h2 className="mb-4 text-lg font-semibold">Meeting Point</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-neutral-900">Search Address</label>
              <LocationAutocomplete
                value={meetingPoint}
                onLocationSelect={handleLocationSelect}
                onAddressChange={handleAddressChange}
                placeholder="Search meeting point address..."
                className="mt-1"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Start typing to find your meeting point address
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900">Meeting Point Address</label>
              <input
                type="text"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                placeholder="e.g., Grand Plaza Hotel, 123 Main Street"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-neutral-500">Default meeting point for tour pickups</p>
            </div>
          </div>

          {/* Coordinates Section */}
          <div className="border-b pb-6">
            <h2 className="mb-4 text-lg font-semibold">Coordinates</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900">Base Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={baseLatitude}
                  onChange={(e) => setBaseLatitude(e.target.value)}
                  placeholder="13.7563"
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-neutral-500">Latitude coordinate (-90 to 90)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900">Base Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={baseLongitude}
                  onChange={(e) => setBaseLongitude(e.target.value)}
                  placeholder="100.5018"
                  className="mt-1 w-full rounded border px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-neutral-500">Longitude coordinate (-180 to 180)</p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="border-b pb-6">
            <h2 className="mb-4 text-lg font-semibold">Contact Information</h2>

            <div>
              <label className="block text-sm font-medium text-neutral-900">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g., +66812345678"
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-neutral-500">Phone number for tour inquiries</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                  ? 'bg-red-100 text-red-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </form>

      {profile && (
        <div className="rounded-lg border bg-neutral-50 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900">Stored Data</h2>
          <pre className="mt-2 overflow-x-auto rounded bg-white p-3 text-xs text-neutral-800">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
