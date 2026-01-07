'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';

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

  // Mock stats
  const stats = [
    { label: 'Total Trips', value: '3', icon: '🎫' },
    { label: 'Days Traveled', value: '13', icon: '📅' },
    { label: 'Money Spent', value: 'PKR 146k', icon: '💰' },
    { label: 'Reviews Given', value: '2', icon: '⭐' },
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

          {/* Stats */}
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="text-3xl">{stat.icon}</div>
                <div className="mt-3 text-2xl font-semibold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Upcoming Trips */}
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Trips</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {upcomingTrips.length} trip{upcomingTrips.length !== 1 ? 's' : ''} booked
                </p>
              </div>
              <Link
                href="/traveler/trips"
                className="text-sm font-semibold text-rose-500 hover:text-rose-600"
              >
                View all →
              </Link>
            </div>

            {upcomingTrips.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {upcomingTrips.map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/traveler/trips/${trip.id}`}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
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
                        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {trip.status}
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
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <p className="text-gray-600">No upcoming trips yet.</p>
                <Link
                  href="/traveler/discovery"
                  className="mt-4 inline-block font-semibold text-rose-500 hover:text-rose-600"
                >
                  Explore trips →
                </Link>
              </div>
            )}
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
