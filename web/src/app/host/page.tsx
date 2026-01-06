'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { listHotelPackages, HotelPackage, submitProviderOnboarding } from '@/lib/api-client';
import { PartnerStatusBanner } from '@/app/components/PartnerStatusBanner';
import { formatApiError } from '@/lib/error-utils';
import { ErrorToast } from '@/app/components/ErrorToast';

export default function HostDashboardPage() {
  const { user, refresh } = useAuth();
  const hotelProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'HOTEL_MANAGER') || null,
    [user],
  );

  const [packages, setPackages] = useState<HotelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<unknown | null>(null);
  // const [statusSubmitting, setStatusSubmitting] = useState(false);

  useEffect(() => {
    if (hotelProfile) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelProfile?.id]);

  const loadStats = async () => {
    if (!hotelProfile) return;
    try {
      setLoading(true);
      const response = await listHotelPackages({ providerId: hotelProfile.id });
      setPackages(response.items || []);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  /* Commented out - unused resubmit handler
  const handleResubmit = async () => {
    if (!hotelProfile) return;
    try {
      setStatusSubmitting(true);
      setStatusError(null);
      setStatusMessage(null);
      await submitProviderOnboarding('HOTEL_MANAGER');
      setStatusMessage('Resubmitted for review. We will notify you when approved.');
      await refresh();
    } catch (err) {
      setStatusError(err);
    } finally {
      setStatusSubmitting(false);
    }
  };
  */

  const stats = useMemo(() => {
    const totalPackages = packages.length;
    const publishedPackages = packages.filter((p) => p.status === 'PUBLISHED').length;
    const draftPackages = packages.filter((p) => p.status === 'DRAFT').length;
    const pausedPackages = packages.filter((p) => p.status === 'PAUSED').length;
    const totalRevenue = packages
      .filter((p) => p.status === 'PUBLISHED')
      .reduce((sum, p) => sum + (p.pricePerPerson || 0), 0);
    const recentPackages = packages
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);

    return {
      totalPackages,
      publishedPackages,
      draftPackages,
      pausedPackages,
      totalRevenue,
      recentPackages,
    };
  }, [packages]);

  if (!hotelProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Welcome to TripAvail Host</h2>
          <p className="text-neutral-600">Complete onboarding to start listing your property</p>
          <Link
            href="/host/onboarding"
            className="inline-block rounded-md bg-black px-6 py-3 text-white font-medium"
          >
            Start Onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hotelProfile && <PartnerStatusBanner profile={hotelProfile} />}

      {statusError != null && (
        <ErrorToast 
          error={statusError} 
          message={formatApiError(statusError)}
          onDismiss={() => setStatusError(null)}
        />
      )}
      {statusMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">{statusMessage}</div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard Overview</h1>
        <Link
          href="/host/packages"
          className="rounded-md bg-black px-4 py-2 text-white text-sm"
        >
          Create Package
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-neutral-600">Loading stats...</div>
      ) : (
        <>
          {/* Stats Panels */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-neutral-600">Total Packages</div>
              <div className="mt-2 text-3xl font-bold">{stats.totalPackages}</div>
              <div className="mt-1 text-xs text-neutral-500">All packages</div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-neutral-600">Published</div>
              <div className="mt-2 text-3xl font-bold text-green-600">{stats.publishedPackages}</div>
              <div className="mt-1 text-xs text-neutral-500">Active packages</div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-neutral-600">Drafts</div>
              <div className="mt-2 text-3xl font-bold text-amber-600">{stats.draftPackages}</div>
              <div className="mt-1 text-xs text-neutral-500">In progress</div>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="text-sm font-medium text-neutral-600">Total Value</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                ${stats.totalRevenue.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-neutral-500">Published packages value</div>
            </div>
          </div>

          {/* Recent Packages */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Packages</h2>
              <Link
                href="/host/packages"
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                View all →
              </Link>
            </div>
            {stats.recentPackages.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-600">
                No packages yet.{' '}
                <Link href="/host/packages" className="text-black underline">
                  Create your first package
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentPackages.map((pkg) => (
                  <Link
                    key={pkg.id}
                    href="/host/packages"
                    className="block rounded border p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{pkg.name || 'Untitled Package'}</h3>
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              pkg.status === 'PUBLISHED'
                                ? 'bg-green-100 text-green-800'
                                : pkg.status === 'PAUSED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {pkg.status || 'DRAFT'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500">
                          {pkg.pricePerPerson && <span>${pkg.pricePerPerson} per person</span>}
                          {pkg.createdAt && (
                            <span>Created: {new Date(pkg.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <Link
                href="/host/packages"
                className="rounded-md border p-4 text-center hover:bg-neutral-50 transition-colors"
              >
                <div className="font-medium">Create Package</div>
                <div className="mt-1 text-xs text-neutral-600">Add a new hotel package</div>
              </Link>
              <Link
                href="/host/properties"
                className="rounded-md border p-4 text-center hover:bg-neutral-50 transition-colors"
              >
                <div className="font-medium">Manage Properties</div>
                <div className="mt-1 text-xs text-neutral-600">View and edit properties</div>
              </Link>
              <Link
                href="/host/onboarding"
                className="rounded-md border p-4 text-center hover:bg-neutral-50 transition-colors"
              >
                <div className="font-medium">Complete Onboarding</div>
                <div className="mt-1 text-xs text-neutral-600">Finish setup steps</div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

