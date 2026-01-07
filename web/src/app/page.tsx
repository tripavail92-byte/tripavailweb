'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '@/app/providers';

export default function TravelerHome() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const [location, setLocation] = useState<string>('Islamabad');
  const [destination, setDestination] = useState<string>('');

  // Mock featured destinations - MUST be before conditionals
  const destinations = useMemo(
    () => [
      {
        id: 'hunza',
        name: 'Hunza Valley',
        trips: 24,
        image:
          'https://images.unsplash.com/photo-1682685793600-0c1643e66c9d?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'skardu',
        name: 'Skardu',
        trips: 18,
        image:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'naran',
        name: 'Naran Kaghan',
        trips: 31,
        image:
          'https://images.unsplash.com/photo-1469854523086-79265b3b5b57?w=800&auto=format&fit=crop&q=80',
      },
      {
        id: 'swat',
        name: 'Swat Valley',
        trips: 15,
        image:
          'https://images.unsplash.com/photo-1542224126-e4e620e819c5?w=800&auto=format&fit=crop&q=80',
      },
    ],
    [],
  );

  // Mock trips data - MUST be before conditionals
  const trips = useMemo(
    () => [
      {
        id: 'hunza-valley',
        title: 'Hunza Valley Explorer',
        provider: 'Serena Hotels',
        rating: 4.9,
        reviews: 127,
        distanceKm: 285,
        pickupTime: '6:00 AM',
        durationDays: 4,
        seatsLeft: 4,
        price: 45000,
        location: 'Hunza Valley',
        image:
          'https://images.unsplash.com/photo-1682685793600-0c1643e66c9d?w=1200&auto=format&fit=crop&q=80',
        tags: ['Departing Today', 'Hotel Package'],
      },
      {
        id: 'skardu-adventure',
        title: 'Skardu Adventure Trek',
        provider: 'Mountain Explorers',
        rating: 4.8,
        reviews: 94,
        distanceKm: 410,
        pickupTime: '7:30 AM',
        durationDays: 6,
        seatsLeft: 9,
        price: 69000,
        location: 'Skardu',
        image:
          'https://images.unsplash.com/photo-1469854523086-79265b3b5b57?w=1200&auto=format&fit=crop&q=80',
        tags: ['Departing Tomorrow', 'Tour'],
      },
      {
        id: 'naran-escape',
        title: 'Naran Kaghan Escape',
        provider: 'Pearl Continental',
        rating: 4.7,
        reviews: 156,
        distanceKm: 195,
        pickupTime: '8:00 AM',
        durationDays: 3,
        seatsLeft: 12,
        price: 32000,
        location: 'Naran',
        image:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=80',
        tags: ['Departing in 3 Days', 'Hotel Package'],
      },
    ],
    [],
  );

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/traveler/dashboard');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, they'll redirect to dashboard in useEffect
  if (user) {
    return null;
  }

  const detectLocation = async () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocation('Your Location'),
        () => setLocation('Islamabad'),
      );
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-teal-50 pb-16 pt-12">
        <div className="mx-auto max-w-7xl px-6">
          {/* Main heading */}
          <div className="text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-gray-900 md:text-7xl">
              Find your next adventure
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Discover amazing trips across Pakistan with live availability, real distances, and
              transparent pricing
            </p>
          </div>

          {/* Search Bar - Airbnb Style */}
          <div className="mx-auto mt-10 max-w-4xl">
            <div className="flex flex-col items-stretch gap-0 rounded-full border border-gray-300 bg-white p-2 shadow-xl transition-shadow hover:shadow-2xl md:flex-row md:items-center">
              {/* From */}
              <div className="flex-1 rounded-full px-6 py-3 transition hover:bg-gray-50">
                <label className="block text-xs font-semibold text-gray-900">Where from</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Islamabad, Lahore..."
                  className="w-full border-none bg-transparent p-0 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                />
              </div>

              {/* Divider */}
              <div className="hidden h-8 w-px bg-gray-300 md:block" />

              {/* To */}
              <div className="flex-1 rounded-full px-6 py-3 transition hover:bg-gray-50">
                <label className="block text-xs font-semibold text-gray-900">Where to</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Hunza, Skardu, Swat..."
                  className="w-full border-none bg-transparent p-0 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                />
              </div>

              {/* Search Button */}
              <Link
                href="/traveler/discovery"
                className="flex items-center gap-2 rounded-full bg-rose-500 px-8 py-4 font-semibold text-white transition hover:bg-rose-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span className="hidden md:inline">Search</span>
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button
                onClick={detectLocation}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Use my location
              </button>
              {!user && (
                <>
                  <Link
                    href="/auth/login"
                    className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl font-semibold text-gray-900">Popular destinations</h2>
        <p className="mt-2 text-gray-600">Explore the most loved places in Pakistan</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((dest) => (
            <Link
              key={dest.id}
              href="/traveler/discovery"
              className="group relative overflow-hidden rounded-2xl"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-semibold">{dest.name}</h3>
                <p className="mt-1 text-sm text-white/90">{dest.trips} trips available</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Trips */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Departing soon</h2>
              <p className="mt-2 text-gray-600">Book your adventure before it's too late</p>
            </div>
            <Link
              href="/traveler/discovery"
              className="hidden font-semibold text-rose-500 hover:text-rose-600 md:block"
            >
              Show all →
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href="/traveler/discovery"
                className="group overflow-hidden rounded-2xl bg-white transition hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={trip.image}
                    alt={trip.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  {trip.tags[0].includes('Today') && (
                    <div className="absolute left-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                      Departing Today
                    </div>
                  )}
                  {trip.seatsLeft <= 5 && (
                    <div className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-900 shadow-lg">
                      Only {trip.seatsLeft} left
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{trip.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{trip.location}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <svg
                        className="h-4 w-4 text-gray-900"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{trip.rating}</span>
                      <span className="text-gray-500">({trip.reviews})</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {trip.durationDays} days
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {trip.distanceKm} km away
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      <span className="text-sm text-gray-600">From </span>
                      <span className="text-lg font-semibold text-gray-900">
                        PKR {(trip.price / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <span className="text-sm font-medium text-rose-500">View details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link
              href="/traveler/discovery"
              className="font-semibold text-rose-500 hover:text-rose-600"
            >
              Show all trips →
            </Link>
          </div>
        </div>
      </section>

      {/* Why TripAvail Section */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Why choose TripAvail</h2>
          <p className="mx-auto mt-2 max-w-2xl text-gray-600">
            The most transparent way to book trips in Pakistan
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              ),
              title: 'Real distances',
              description: 'See exactly how far your trip is from your location',
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
              title: 'Live availability',
              description: 'Book with confidence knowing seats are updated in real-time',
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
              title: 'Verified operators',
              description: 'All tour operators and hotels are verified for your safety',
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ),
              title: 'Transparent pricing',
              description: 'No hidden fees. What you see is what you pay',
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
              ),
              title: 'Secure payments',
              description: 'Your payment information is always protected',
            },
            {
              icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ),
              title: '24/7 support',
              description: 'Our team is here to help whenever you need assistance',
            },
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                {feature.icon}
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-rose-500 to-pink-500 py-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-white md:text-4xl">
            Ready to start your adventure?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Join thousands of travelers discovering Pakistan's most beautiful destinations
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/traveler/discovery"
              className="rounded-full bg-white px-8 py-4 font-semibold text-rose-500 transition hover:bg-gray-100"
            >
              Explore trips
            </Link>
            {!user && (
              <Link
                href="/auth/signup"
                className="rounded-full border-2 border-white px-8 py-4 font-semibold text-white transition hover:bg-white/10"
              >
                Create account
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
