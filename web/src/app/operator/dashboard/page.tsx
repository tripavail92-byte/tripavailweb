'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import { OperatorDashboardLayout } from '@/components/OperatorDashboardLayout';

interface Booking {
  id: string;
  guestName: string;
  tourName: string;
  departureDate: string;
  endDate: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  seats: number;
}

export default function OperatorDashboardPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <OperatorDashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </OperatorDashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  // Mock data for tour operator
  const stats = [
    { label: 'Active Tours', value: 3, icon: '🚌', color: 'blue' },
    { label: 'Upcoming Departures', value: 8, icon: '📅', color: 'cyan' },
    { label: 'This Month Bookings', value: 24, icon: '👥', color: 'indigo' },
    { label: 'Avg Rating', value: '4.7', icon: '⭐', color: 'yellow' },
  ];

  const recentBookings: Booking[] = [
    {
      id: 'BK101',
      guestName: 'Ali Raza',
      tourName: 'Northern Lights Explorer',
      departureDate: '2026-01-25',
      endDate: '2026-01-30',
      status: 'CONFIRMED',
      totalAmount: 85000,
      seats: 2,
    },
    {
      id: 'BK102',
      guestName: 'Hina Ahmed',
      tourName: 'Hunza Valley Trek',
      departureDate: '2026-02-05',
      endDate: '2026-02-08',
      status: 'PENDING',
      totalAmount: 65000,
      seats: 1,
    },
    {
      id: 'BK103',
      guestName: 'Samir Khan',
      tourName: 'Skardu Adventure',
      departureDate: '2026-02-15',
      endDate: '2026-02-20',
      status: 'CONFIRMED',
      totalAmount: 145000,
      seats: 3,
    },
    {
      id: 'BK104',
      guestName: 'Zainab Ali',
      tourName: 'Desert Safari Plus',
      departureDate: '2026-02-22',
      endDate: '2026-02-25',
      status: 'CONFIRMED',
      totalAmount: 55000,
      seats: 1,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <OperatorDashboardLayout>
      <div className="bg-gray-50 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.email?.split('@')[0]}! 👋
          </h1>
          <p className="mt-2 text-gray-600">Manage your tours and track your bookings.</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
                  <Link
                    href="/operator/bookings"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{booking.guestName}</h3>
                        <p className="mt-1 text-sm text-gray-600">{booking.tourName}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                          <span>
                            📅 {booking.departureDate} → {booking.endDate}
                          </span>
                          <span>
                            👥 {booking.seats} {booking.seats === 1 ? 'person' : 'people'}
                          </span>
                          <span>💰 PKR {booking.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(booking.status)}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Tours */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/operator/tours/create"
                  className="block rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-blue-200"
                >
                  + New Tour
                </Link>
                <Link
                  href="/operator/tours"
                  className="block rounded-lg border-2 border-blue-500 px-4 py-3 text-center text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                >
                  🚌 Manage Tours
                </Link>
                <Link
                  href="/operator/analytics"
                  className="block rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  📊 View Analytics
                </Link>
              </div>
            </div>

            {/* Upcoming Departures */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Departures</h3>
              <div className="space-y-3">
                {[
                  { name: 'Hunza Valley Trek', date: 'Jan 25', seats: '18/20' },
                  { name: 'Skardu Adventure', date: 'Feb 5', seats: '22/25' },
                  { name: 'Desert Safari Plus', date: 'Feb 15', seats: '12/15' },
                ].map((tour) => (
                  <div
                    key={tour.name}
                    className="rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{tour.name}</p>
                        <p className="text-xs text-gray-600">{tour.date}</p>
                      </div>
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                        {tour.seats} Booked
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OperatorDashboardLayout>
  );
}
