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
  };
  expiresAt?: string;
  createdAt: string;
}

export default function BookingConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthContext();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  });

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchBooking();
  }, [token, bookingId]);

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

  const handleConfirmBooking = async () => {
    if (!booking) return;

    try {
      setConfirmLoading(true);
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `${booking.id}-confirm`,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/bookings/${booking.id}/confirm`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            paymentMethod,
            ...(paymentMethod === 'card' && { cardDetails }),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to confirm booking');
      const data = await response.json();
      setBooking(data);
      // Navigate to success page
      router.push(`/bookings/${booking.id}/success`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to confirm booking');
    } finally {
      setConfirmLoading(false);
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
          <Link href={`/bookings/${booking.id}`} className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
          <p className="text-gray-600 mt-2">Enter your payment details to confirm your reservation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition"
                  style={{ borderColor: paymentMethod === 'card' ? '#2563eb' : undefined }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-medium text-gray-900">Credit/Debit Card</span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition"
                  style={{ borderColor: paymentMethod === 'wallet' ? '#2563eb' : undefined }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-medium text-gray-900">Digital Wallet</span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition"
                  style={{ borderColor: paymentMethod === 'bank' ? '#2563eb' : undefined }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={paymentMethod === 'bank'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-medium text-gray-900">Bank Transfer</span>
                </label>
              </div>
            </div>

            {/* Card Details Form */}
            {paymentMethod === 'card' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Card Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={cardDetails.nameOnCard}
                      onChange={(e) => setCardDetails({ ...cardDetails, nameOnCard: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      placeholder="4532 1234 5678 9010"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={cardDetails.expiryDate}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cvv}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        placeholder="123"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'wallet' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Select Wallet</h2>
                <p className="text-gray-600 mb-4">Wallet payment coming soon. Please use another method.</p>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Bank Transfer</h2>
                <p className="text-gray-600 mb-4">Bank transfer details will be provided after confirmation.</p>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-1 w-4 h-4" />
                <span className="text-sm text-blue-900">
                  I agree to the booking terms and conditions, cancellation policy, and privacy policy
                </span>
              </label>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b">
                <div>
                  <p className="text-sm text-gray-600">Package</p>
                  <p className="font-semibold text-gray-900">{booking.packageName}</p>
                </div>
                {booking.checkInDate && (
                  <div>
                    <p className="text-sm text-gray-600">Dates</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(booking.checkInDate).toLocaleDateString()} - {booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Guests</p>
                  <p className="font-semibold text-gray-900">{booking.numberOfGuests}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price</span>
                  <span className="text-gray-900">${priceDetails.basePrice.toFixed(2)}</span>
                </div>
                {priceDetails.taxes > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes</span>
                    <span className="text-gray-900">${priceDetails.taxes.toFixed(2)}</span>
                  </div>
                )}
                {priceDetails.fees > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fees</span>
                    <span className="text-gray-900">${priceDetails.fees.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">${priceDetails.total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleConfirmBooking}
                disabled={confirmLoading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
              >
                {confirmLoading ? 'Processing...' : 'Confirm & Pay'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                🔒 Secure payment processing by TripAvail
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
