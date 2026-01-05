'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BookingSuccessPage() {
  const params = useParams();
  const bookingId = params?.id as string;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed! 🎉</h1>
        <p className="text-gray-600 mb-8">
          Your reservation has been successfully confirmed. You will receive a confirmation email shortly.
        </p>

        {/* Booking Reference */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <p className="text-sm text-gray-600 mb-2">Booking Reference</p>
          <p className="text-2xl font-mono font-bold text-gray-900 break-all">{bookingId}</p>
          <button
            onClick={() => navigator.clipboard.writeText(bookingId)}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            Copy reference
          </button>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
          <h3 className="font-bold text-blue-900 mb-3">What's next?</h3>
          <ul className="space-y-2 text-sm text-blue-900">
            <li>✓ Check your email for the confirmation</li>
            <li>✓ View your booking details in your account</li>
            <li>✓ Download your invoice and vouchers</li>
            <li>✓ Contact support if you have any questions</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/traveler/bookings"
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            View My Bookings
          </Link>
          <Link
            href="/traveler/discovery"
            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Continue Browsing
          </Link>
        </div>

        {/* Support */}
        <p className="text-xs text-gray-500 mt-8">
          Need help? <a href="#" className="text-blue-600 hover:text-blue-700">Contact our support team</a>
        </p>
      </div>
    </div>
  );
}
