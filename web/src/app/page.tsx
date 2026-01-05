'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import Link from 'next/link';

export default function TravelerHome() {
  const router = useRouter();
  const { user } = useAuthContext();

  useEffect(() => {
    // Redirect to discovery if already authenticated as traveler
    if (user?.role === 'TRAVELER') {
      router.push('/traveler/discovery');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Discover Your Next Adventure
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Book amazing hotels, tours, and stays all in one place
          </p>
          {!user ? (
            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/login"
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-8 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-700 transition"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <Link
              href="/traveler/discovery"
              className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition"
            >
              Start Browsing →
            </Link>
          )}
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-4xl mb-4">🏨</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hotel Packages</h3>
            <p className="text-gray-600">
              Curated hotel packages from verified providers around the world
            </p>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-4xl mb-4">🧳</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Tours & Experiences</h3>
            <p className="text-gray-600">
              Guided tours and local experiences tailored to your interests
            </p>
          </div>
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-4xl mb-4">🏡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Stays</h3>
            <p className="text-gray-600">Unique accommodations for every budget and travel style</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-8">Why TripAvail?</h2>
          <ul className="space-y-4 max-w-2xl mx-auto text-left">
            <li className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <span>Verified providers with secure booking guarantee</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <span>Price locked at quote – no surprises at checkout</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <span>15-minute hold to review and confirm your booking</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-2xl">✓</span>
              <span>24/7 customer support and dispute resolution</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
