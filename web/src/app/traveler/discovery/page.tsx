'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { apiFetch, getAccessToken } from '@/lib/api-client';
import { GridSkeleton, EmptyState } from '@/components/ui';

interface HotelPackage {
  id: string;
  name: string;
  description: string;
  templateId?: string;
  basePrice?: number;
  pricePerPerson?: number;
  location?: string;
  numberOfRooms?: number;
  inclusions?: string[];
  status: string;
}

interface TourPackage {
  id: string;
  name: string;
  description: string;
  templateId?: string;
  basePrice?: number;
  pricePerPerson?: number;
  tripType: string;
  location?: string;
  numberOfDays?: number;
  inclusions?: string[];
  status: string;
}

const packageTypes = [
  { id: 'weekend-getaway', title: 'Weekend Getaway' },
  { id: 'honeymoon', title: 'Romantic Escape' },
  { id: 'family-vacation', title: 'Family Adventure' },
  { id: 'corporate-retreat', title: 'Business Elite' },
  { id: 'adventure', title: 'Adventure Package' },
  { id: 'food-wine', title: 'Culinary Journey' },
  { id: 'wellness-spa', title: 'Wellness Retreat' },
  { id: 'staycation', title: 'Luxury Experience' },
];

export default function DiscoveryPage() {
  const [hotelPackages, setHotelPackages] = useState<HotelPackage[]>([]);
  const [tourPackages, setTourPackages] = useState<TourPackage[]>([]);
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [loadingTour, setLoadingTour] = useState(true);
  const [errorHotel, setErrorHotel] = useState<string | null>(null);
  const [errorTour, setErrorTour] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    fetchHotelPackages();
    fetchTourPackages();
  }, [authLoading, user, searchQuery, templateFilter]);

  const fetchHotelPackages = async () => {
    try {
      setLoadingHotel(true);
      setErrorHotel(null);

      const token = getAccessToken();

      if (!token) {
        throw new Error('Missing session token. Please log in again.');
      }

      const query = new URLSearchParams({
        status: 'PUBLISHED',
        search: searchQuery,
      });

      if (templateFilter && templateFilter !== 'custom') {
        query.append('templateId', templateFilter);
      }

      const data = await apiFetch<{ data?: HotelPackage[]; items?: HotelPackage[] }>(
        `/v1/hotel-packages?${query.toString()}`
      );
      const items = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : [];
      setHotelPackages(items);
    } catch (err) {
      setErrorHotel(err instanceof Error ? err.message : 'Unable to load hotel packages');
    } finally {
      setLoadingHotel(false);
    }
  };

  const fetchTourPackages = async () => {
    try {
      setLoadingTour(true);
      setErrorTour(null);

      const token = getAccessToken();
      if (!token) {
        throw new Error('Missing session token. Please log in again.');
      }

      const query = new URLSearchParams({
        status: 'PUBLISHED',
        search: searchQuery,
      });

      const data = await apiFetch<{ data?: TourPackage[]; items?: TourPackage[] }>(
        `/v1/tour-packages?${query.toString()}`
      );
      const items = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : [];
      setTourPackages(items);
    } catch (err) {
      setErrorTour(err instanceof Error ? err.message : 'Unable to load tour packages');
    } finally {
      setLoadingTour(false);
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

  const priceLabel = (pkg: { basePrice?: number; pricePerPerson?: number }) => {
    const price = pkg.basePrice ?? pkg.pricePerPerson;
    if (price === undefined || price === null) return '—';
    return `PKR ${Math.round(price).toLocaleString()}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header Section */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Discover & Book</h1>
          <p className="text-gray-600 mt-2">Find your perfect getaway or adventure</p>

          {/* Search Bar */}
          <div className="mt-6 flex gap-3">
            <input
              type="text"
              placeholder="Search destinations, hotels, or tours..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                fetchHotelPackages();
                fetchTourPackages();
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Hotel Packages */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Hotel Packages</h2>
              <p className="text-gray-600">Curated experiences from partner hotels. Set by hotel managers.</p>
            </div>
            <select
              value={templateFilter ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setTemplateFilter(val || null);
                fetchHotelPackages();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Package Types</option>
              {packageTypes.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title}
                </option>
              ))}
            </select>
          </div>

          {loadingHotel && (
            <GridSkeleton count={6} columns={3} />
          )}

          {errorHotel && !loadingHotel && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{errorHotel}</p>
              <button
                onClick={fetchHotelPackages}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!loadingHotel && !errorHotel && hotelPackages.length === 0 && (
            <EmptyState 
              title="No Hotel Packages Yet"
              description="Adjust your search or pick another package type."
              icon="🏨"
            />
          )}

          {!loadingHotel && !errorHotel && hotelPackages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotelPackages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/listings/hotel/${pkg.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition shadow"
                >
                  <div className="relative h-56 bg-gradient-to-br from-blue-400 to-blue-600">
                    <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1">
                      Hotel Package
                    </span>
                    {templateLabel(pkg.templateId) && (
                      <span className="absolute top-3 right-3 inline-flex items-center rounded-full bg-white/90 text-blue-700 text-xs font-semibold px-3 py-1">
                        {templateLabel(pkg.templateId)}
                      </span>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition line-clamp-2">
                        {pkg.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                    </div>
                    {pkg.inclusions && pkg.inclusions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pkg.inclusions.slice(0, 4).map((inc) => (
                          <span
                            key={inc}
                            className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            {inc}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-blue-700">{priceLabel(pkg)}</p>
                        <p className="text-xs text-gray-500">per person</p>
                      </div>
                      <span className="text-sm font-medium text-blue-700 flex items-center gap-1">View package →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Tour Packages */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Tour Operator Packages</h2>
              <p className="text-gray-600">Adventures crafted by tour operators.</p>
            </div>
          </div>

          {loadingTour && (
            <GridSkeleton count={6} columns={3} />
          )}

          {errorTour && !loadingTour && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{errorTour}</p>
              <button
                onClick={fetchTourPackages}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!loadingTour && !errorTour && tourPackages.length === 0 && (
            <EmptyState 
              title="No Tour Packages Yet"
              description="Try a different search."
              icon="🎒"
            />
          )}

          {!loadingTour && !errorTour && tourPackages.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tourPackages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/listings/tour/${pkg.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-gray-100 hover:shadow-lg transition shadow"
                >
                  <div className="relative h-56 bg-gradient-to-br from-purple-500 to-pink-500">
                    <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-purple-600 text-white text-xs font-semibold px-3 py-1">
                      Operator Package
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition line-clamp-2">
                        {pkg.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                    </div>
                    {pkg.inclusions && pkg.inclusions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pkg.inclusions.slice(0, 4).map((inc) => (
                          <span
                            key={inc}
                            className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                          >
                            {inc}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-purple-700">{priceLabel(pkg)}</p>
                        <p className="text-xs text-gray-500">per person</p>
                      </div>
                      <span className="text-sm font-medium text-purple-700 flex items-center gap-1">View package →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
