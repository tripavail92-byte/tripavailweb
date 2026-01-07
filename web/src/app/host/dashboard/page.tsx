'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import { HostDashboardLayout } from '@/components/HostDashboardLayout';

interface Booking {
  id: string;
  guestName: string;
  package: string;
  property: string;
  checkIn: string;
  checkOut: string;
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
}

export default function HostDashboardPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <HostDashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-amber-500" />
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </HostDashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  // Mock data for hotel manager
  const stats = [
    { label: 'Active Packages', value: 5, icon: '📦', color: 'amber' },
    { label: 'Upcoming Bookings', value: 12, icon: '📅', color: 'blue' },
    { label: 'This Month Revenue', value: 'PKR 542K', icon: '💰', color: 'green' },
    { label: 'Avg Rating', value: '4.8', icon: '⭐', color: 'yellow' },
  ];

  const recentBookings: Booking[] = [
    {
      id: 'BK001',
      guestName: 'Ahmad Ali',
      package: 'Mountain Escape 3-Days',
      property: 'Serena Hotels Hunza',
      checkIn: '2026-01-20',
      checkOut: '2026-01-23',
      status: 'CONFIRMED',
      totalAmount: 125000,
    },
    {
      id: 'BK002',
      guestName: 'Fatima Khan',
      package: 'Luxury Weekend Package',
      property: 'Serena Hotels Hunza',
      checkIn: '2026-01-25',
      checkOut: '2026-01-27',
      status: 'PENDING',
      totalAmount: 89000,
    },
    {
      id: 'BK003',
      guestName: 'Hassan Ahmed',
      package: 'Adventure Trek Plus',
      property: 'Mountain Explorers Lodge',
      checkIn: '2026-02-01',
      checkOut: '2026-02-05',
      status: 'CONFIRMED',
      totalAmount: 156000,
    },
    {
      id: 'BK004',
      guestName: 'Zara Malik',
      package: 'Wellness & Spa Retreat',
      property: 'Serena Hotels Hunza',
      checkIn: '2026-02-10',
      checkOut: '2026-02-12',
      status: 'CONFIRMED',
      totalAmount: 98000,
    },
  ];

  const properties = [
    { id: 1, name: 'Serena Hotels Hunza', rooms: 24, utilization: 78 },
    { id: 2, name: 'Mountain Explorers Lodge', rooms: 12, utilization: 85 },
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
    <HostDashboardLayout>
      <div className="bg-gray-50 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.email?.split('@')[0]}! 👋
          </h1>
          <p className="mt-2 text-gray-600">Here's what's happening with your properties today.</p>
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
                    href="/host/bookings"
                    className="text-sm text-amber-600 hover:text-amber-700"
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
                        <p className="mt-1 text-sm text-gray-600">{booking.package}</p>
                        <p className="text-xs text-gray-500">{booking.property}</p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                          <span>
                            📅 {booking.checkIn} → {booking.checkOut}
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

          {/* Quick Actions & Properties */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/host/packages/create"
                  className="block rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-amber-200"
                >
                  + New Package
                </Link>
                <Link
                  href="/host/properties"
                  className="block rounded-lg border-2 border-amber-500 px-4 py-3 text-center text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                >
                  📍 Manage Properties
                </Link>
                <Link
                  href="/host/analytics"
                  className="block rounded-lg border-2 border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  📊 View Analytics
                </Link>
              </div>
            </div>

            {/* Properties Overview */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Properties</h3>
              <div className="space-y-4">
                {properties.map((property) => (
                  <div key={property.id} className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{property.name}</p>
                        <p className="text-xs text-gray-600">{property.rooms} rooms</p>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {property.utilization}% Util.
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{ width: `${property.utilization}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HostDashboardLayout>
  );
}
