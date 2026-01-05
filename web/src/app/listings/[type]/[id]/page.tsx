'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import { apiFetch, getAccessToken } from '@/lib/api-client';
import Link from 'next/link';

interface HotelPackageDetail {
  id: string;
  name: string;
  description: string;
  templateId?: string;
  basePrice?: number;
  pricePerPerson?: number;
  location?: string;
  numberOfRooms?: number;
  inclusions?: string[];
  exclusions?: string[];
  amenities?: Array<{ id: string; name: string }>;
  status: string;
}

interface TourPackageDetail {
  id: string;
  name: string;
  description: string;
  templateId?: string;
  basePrice?: number;
  pricePerPerson?: number;
  tripType?: string;
  location?: string;
  numberOfDays?: number;
  inclusions?: string[];
  exclusions?: string[];
  itinerary?: Array<{ dayNumber: number; title: string; description: string }>;
  status: string;
}

export default function ListingDetail() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [pkg, setPkg] = useState<HotelPackageDetail | TourPackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const packageType = params?.type as string;
  const packageId = params?.id as string;

  useEffect(() => {
    fetchPackageDetail();
  }, [packageType, packageId]);

  const fetchPackageDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint =
        packageType === 'tour'
          ? `/v1/tour-packages/${packageId}`
          : `/v1/hotel-packages/${packageId}`;

      const data = await apiFetch<HotelPackageDetail | TourPackageDetail>(endpoint);
      setPkg(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load package');
    } finally {
      setLoading(false);
    }
  };

  const handleGetQuote = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!pkg || !checkInDate) {
      alert('Please fill in required fields');
      return;
    }

    try {
      setQuoteLoading(true);
      const response = await apiFetch<{ id: string; quote?: { total: number } }>(
        '/v1/bookings/quote',
        {
          method: 'POST',
          body: {
            packageId: pkg.id,
            packageType: packageType.toUpperCase(),
            ...(packageType === 'hotel' && {
              checkInDate,
              numberOfGuests,
              numberOfRooms,
            }),
            ...(packageType === 'tour' && {
              departureDate: checkInDate,
              numberOfGuests,
            }),
          },
        }
      );
      router.push(`/bookings/${response.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to get quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  const templateLabel = (templateId?: string) => {
    if (!templateId) return null;
    const labels: Record<string, string> = {
      'weekend-getaway': 'Weekend Getaway',
      'honeymoon': 'Romantic Escape',
      'family-vacation': 'Family Adventure',
      'corporate-retreat': 'Business Elite',
      'adventure': 'Adventure Package',
      'food-wine': 'Culinary Journey',
      'wellness-spa': 'Wellness Retreat',
      'staycation': 'Luxury Experience',
    };
    // If numeric ID (database ID), skip label; only show if slug-based
    if (/^\d+$/.test(templateId)) return null;
    return labels[templateId?.toLowerCase()] || templateId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-gray-200 rounded-lg" />
            <div className="h-8 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-800 mb-4">{error || 'Package not found'}</p>
            <Link
              href="/traveler/discovery"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Discovery
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const price = (pkg as any).basePrice ?? (pkg as any).pricePerPerson ?? 0;
  const priceLabel = `PKR ${Math.round(price).toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/traveler/discovery" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to Packages
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero */}
            <div className="bg-white rounded-lg overflow-hidden shadow">
              <div className="h-96 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <div className="text-white text-6xl">
                  {packageType === 'hotel' ? '🏨' : '🧳'}
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="bg-white rounded-lg p-6 shadow">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{pkg.name}</h1>
              <p className="text-gray-700 mb-6">{pkg.description}</p>

              {/* Info Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {(pkg as any).location && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">📍 Location</p>
                    <p className="font-semibold text-gray-900">{(pkg as any).location}</p>
                  </div>
                )}
                {(pkg as any).numberOfDays && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">📅 Duration</p>
                    <p className="font-semibold text-gray-900">{(pkg as any).numberOfDays} days</p>
                  </div>
                )}
                {(pkg as any).templateId && templateLabel((pkg as any).templateId) && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">🏷️ Type</p>
                    <p className="font-semibold text-gray-900">{templateLabel((pkg as any).templateId)}</p>
                  </div>
                )}
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">✓ Status</p>
                  <p className="font-semibold text-green-700 capitalize">{pkg.status}</p>
                </div>
              </div>
            </div>

            {/* Inclusions */}
            {pkg.inclusions && pkg.inclusions.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pkg.inclusions.map((inc, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-green-600 text-lg">✓</span>
                      <span className="text-gray-700">{inc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusions */}
            {pkg.exclusions && pkg.exclusions.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4">What's Excluded</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pkg.exclusions.map((exc, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-gray-400 text-lg">✗</span>
                      <span className="text-gray-700">{exc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {(pkg as any).amenities && (pkg as any).amenities.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities & Facilities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(pkg as any).amenities.map((amenity: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-blue-600">★</span>
                      <span className="text-gray-700">{amenity.name || amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary */}
            {(pkg as any).itinerary && (pkg as any).itinerary.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Itinerary</h2>
                <div className="space-y-4">
                  {(pkg as any).itinerary.map((day: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold text-gray-900">
                        Day {day.dayNumber || idx + 1}: {day.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">{day.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8 space-y-6">
              {/* Price */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Price per {packageType === 'hotel' ? 'night' : 'person'}</p>
                <p className="text-3xl font-bold text-blue-700">{priceLabel}</p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {packageType === 'hotel' ? 'Check-in' : 'Departure Date'}
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={numberOfGuests}
                    onChange={(e) => setNumberOfGuests(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {packageType === 'hotel' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Rooms
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numberOfRooms}
                      onChange={(e) => setNumberOfRooms(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={handleGetQuote}
                disabled={quoteLoading || !user}
                className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {quoteLoading ? 'Getting Quote...' : user ? 'Get Quote' : 'Login to Book'}
              </button>

              {!user && (
                <p className="text-xs text-gray-600 text-center">
                  Sign in to see pricing and book
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
