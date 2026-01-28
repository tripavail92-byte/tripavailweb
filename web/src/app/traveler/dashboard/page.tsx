'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { QuickActionGrid } from '@/components/dashboard/QuickActionGrid';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

export default function TravelerDashboard() {
  // Mock upcoming trips
  const upcomingTrips = [
    {
      id: 1,
      title: 'Hunza Valley Explorer',
      provider: 'Serena Hotels',
      departureDate: '2026-01-15',
      status: 'CONFIRMED',
      price: 45000,
      image:
        'https://images.unsplash.com/photo-1682685793600-0c1643e66c9d?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      title: 'Skardu Adventure Trek',
      provider: 'Mountain Explorers',
      departureDate: '2026-02-10',
      status: 'CONFIRMED',
      price: 69000,
      image:
        'https://images.unsplash.com/photo-1469854523086-79265b3b5b57?w=400&auto=format&fit=crop&q=80',
    },
  ];

  // Mock past trips
  const pastTrips = [
    {
      id: 3,
      title: 'Naran Kaghan Escape',
      provider: 'Pearl Continental',
      departureDate: '2025-12-15',
      status: 'COMPLETED',
      price: 32000,
      image:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&auto=format&fit=crop&q=80',
    },
  ];



  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">Welcome back!</h1>
            <p className="mt-2 text-gray-600">Here's what's happening with your trips</p>
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
            <QuickActionGrid />
          </div>

          {/* Stats */}
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Travel Overview</h2>
            <StatsOverview />
          </div>

          {/* Stats */}
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Travel Overview</h2>
            <StatsOverview />
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Upcoming Trips */}
              {/* Existing Trips Logic Here */}
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Upcoming Trips</h2>
              <div className="text-gray-500">
                {/* Placeholder for existing trips list reuse */}
                {upcomingTrips.length > 0 ? (
                  <div className="grid gap-6">
                    {upcomingTrips.map((trip) => (
                      <Link
                        key={trip.id}
                        href={`/traveler/trips/${trip.id}`}
                        className="flex items-center gap-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-lg"
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <img src={trip.image} alt={trip.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                          <p className="text-sm text-gray-500">{trip.provider}</p>
                        </div>
                        <div className="text-right">
                          <span className="block rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                            {trip.status}
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-gray-900">
                            ${(trip.price / 1000).toFixed(0)}k
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div>No trips</div>
                )}
              </div>
            </div>
            <div>
              <RecentActivity />
            </div>
          </div>

          {/* Past Trips */}
          {pastTrips.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Past Trips</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {pastTrips.length} completed trip{pastTrips.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {pastTrips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/traveler/trips/${trip.id}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white opacity-75 transition hover:opacity-100"
                  >
                    <div className="aspect-video overflow-hidden bg-gray-100">
                      <img
                        src={trip.image}
                        alt={trip.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                          <p className="text-xs text-gray-500">{trip.provider}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          COMPLETED
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-sm text-gray-600">
                          {new Date(trip.departureDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="font-semibold text-gray-900">
                          PKR {(trip.price / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
