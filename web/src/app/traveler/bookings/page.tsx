'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import Link from 'next/link';

interface Booking {
  id: string;
  status: string;
  packageName?: string;
  packageType: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests: number;
  createdAt: string;
  priceSnapshot?: {
    total: number;
  };
}

const statusColors: Record<string, { bg: string; text: string }> = {
  QUOTE: { bg: 'bg-blue-100', text: 'text-blue-800' },
  HOLD: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800' },
  COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-800' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function TravelerBookingsPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchBookings();
  }, [user, statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      };

      const url =
        statusFilter === 'all'
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/bookings`
          : `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/bookings?status=${statusFilter}`;

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data.data || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    return statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-gray-600 mt-2">View and manage your reservations</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white border-b mb-8">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'QUOTE', 'HOLD', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-4 font-medium transition border-b-2 whitespace-nowrap ${
                  statusFilter === status
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {status === 'all' ? 'All Bookings' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && bookings.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No bookings yet</h2>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all'
                ? "You haven't made any bookings yet."
                : `You don't have any ${statusFilter} bookings.`}
            </p>
            <Link
              href="/traveler/discovery"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Packages
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && bookings.length > 0 && (
          <div className="grid gap-4">
            {bookings.map((booking) => {
              const colors = getStatusColor(booking.status);
              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow hover:shadow-md transition overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      {/* Booking Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="text-3xl">
                            {booking.packageType === 'TOUR' ? '🧳' : '🏨'}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {booking.packageName || `${booking.packageType} Package`}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              Booking ID:{' '}
                              <span className="font-mono text-gray-900">{booking.id}</span>
                            </p>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {booking.checkInDate && (
                                <div>
                                  <p className="text-gray-600">Check-in</p>
                                  <p className="font-semibold text-gray-900">
                                    {formatDate(booking.checkInDate)}
                                  </p>
                                </div>
                              )}
                              {booking.checkOutDate && (
                                <div>
                                  <p className="text-gray-600">Check-out</p>
                                  <p className="font-semibold text-gray-900">
                                    {formatDate(booking.checkOutDate)}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-gray-600">Guests</p>
                                <p className="font-semibold text-gray-900">
                                  {booking.numberOfGuests}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Created</p>
                                <p className="font-semibold text-gray-900">
                                  {formatDate(booking.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status & Price */}
                      <div className="flex flex-col items-end gap-4 md:ml-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}
                        >
                          {booking.status}
                        </span>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="text-2xl font-bold text-blue-600">
                            ${(booking.priceSnapshot?.total || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
