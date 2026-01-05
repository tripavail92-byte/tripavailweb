'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import Link from 'next/link';

interface Booking {
  id: string;
  status: string;
  packageId: string;
  packageName?: string;
  packageType: string;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests: number;
  numberOfRooms?: number;
  priceSnapshot?: {
    basePrice: number;
    taxes: number;
    fees: number;
    total: number;
    breakdown?: Record<string, number>;
  };
  expiresAt?: string;
  createdAt: string;
}

export default function BookingQuotePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthContext();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdLoading, setHoldLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchBooking();
  }, [token, bookingId]);

  useEffect(() => {
    if (!booking?.expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(booking.expiresAt!).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        clearInterval(interval);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking?.expiresAt]);

  const fetchBooking = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/bookings/${bookingId}`,
        { headers }
      );

      if (!response.ok) throw new Error('Failed to fetch booking details');
      const data = await response.json();
      setBooking(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleHoldBooking = async () => {
    if (!booking) return;

    try {
      setHoldLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `${booking.id}-hold`,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/bookings/${booking.id}/hold`,
        {
          method: 'POST',
          headers,
        }
      );

      if (!response.ok) throw new Error('Failed to hold booking');
      const data = await response.json();
      setBooking(data);
      // Navigate to confirmation page
      router.push(`/bookings/${booking.id}/confirm`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to hold booking');
    } finally {
      setHoldLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-800 mb-4">{error || 'Booking not found'}</p>
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

  const priceDetails = booking.priceSnapshot || {
    basePrice: 0,
    taxes: 0,
    fees: 0,
    total: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/traveler/discovery" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Discovery
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Price Quote</h1>
          <p className="text-gray-600 mt-2">Review your quote and hold your reservation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quote Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'QUOTE'
                    ? 'bg-blue-100 text-blue-800'
                    : booking.status === 'HOLD'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {booking.status}
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Package</p>
                    <p className="font-semibold text-gray-900">{booking.packageName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold text-gray-900">{booking.packageType}</p>
                  </div>
                  {booking.checkInDate && (
                    <div>
                      <p className="text-sm text-gray-600">Check-in</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(booking.checkInDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {booking.checkOutDate && (
                    <div>
                      <p className="text-sm text-gray-600">Check-out</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(booking.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Guests</p>
                    <p className="font-semibold text-gray-900">{booking.numberOfGuests}</p>
                  </div>
                  {booking.numberOfRooms && (
                    <div>
                      <p className="text-sm text-gray-600">Rooms</p>
                      <p className="font-semibold text-gray-900">{booking.numberOfRooms}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Price Breakdown</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Base Price</span>
                  <span className="font-semibold text-gray-900">${priceDetails.basePrice.toFixed(2)}</span>
                </div>
                {priceDetails.taxes > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Taxes</span>
                    <span className="font-semibold text-gray-900">${priceDetails.taxes.toFixed(2)}</span>
                  </div>
                )}
                {priceDetails.fees > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Service Fees</span>
                    <span className="font-semibold text-gray-900">${priceDetails.fees.toFixed(2)}</span>
                  </div>
                )}

                {priceDetails.breakdown && Object.entries(priceDetails.breakdown).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{key}</span>
                    <span className="text-gray-900">${(value as number).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-3xl font-bold text-blue-600">${priceDetails.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                ℹ️ <strong>Price Locked:</strong> This price is locked in and guaranteed. Once you hold this reservation, you have {timeRemaining || '15 minutes'} to complete your booking.
              </p>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              {/* Timer */}
              {booking.status === 'QUOTE' && booking.expiresAt && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900 font-medium">Quote expires in:</p>
                  <p className="text-2xl font-bold text-yellow-600">{timeRemaining}</p>
                </div>
              )}

              {/* Total Price */}
              <div className="mb-6 pb-6 border-b">
                <p className="text-sm text-gray-600 mb-1">Total Price</p>
                <p className="text-3xl font-bold text-blue-600">${priceDetails.total.toFixed(2)}</p>
              </div>

              {/* Action Buttons */}
              {booking.status === 'QUOTE' && (
                <button
                  onClick={handleHoldBooking}
                  disabled={holdLoading}
                  className="w-full mb-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                >
                  {holdLoading ? 'Holding Reservation...' : 'Hold This Price'}
                </button>
              )}

              {booking.status === 'HOLD' && (
                <button
                  onClick={() => router.push(`/bookings/${booking.id}/confirm`)}
                  className="w-full mb-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Proceed to Payment
                </button>
              )}

              <button
                onClick={() => router.back()}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Back
              </button>

              {/* Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Security:</strong> Your payment information is encrypted and secure. We use industry-standard protocols to protect your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
