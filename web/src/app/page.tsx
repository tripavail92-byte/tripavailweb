'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/app/providers';

export default function TravelerHome() {
  const { user } = useAuthContext();

  // Simple location + time state (placeholder; can integrate real geolocation later)
  const [location, setLocation] = useState<string>('Islamabad');
  const [now, setNow] = useState<string>('');

  useEffect(() => {
    const updateTime = () =>
      setNow(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const t = setInterval(updateTime, 60_000);
    return () => clearInterval(t);
  }, []);

  const detectLocation = async () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocation('Your Location'),
        () => setLocation('Islamabad'),
      );
    }
  };

  // Mock trips data (replace with API later)
  const trips = useMemo(
    () => [
      {
        id: 'hunza-valley',
        title: 'Hunza Valley Explorer',
        provider: 'Serena Hotels',
        distanceKm: 285,
        pickupTime: '6:00 AM',
        durationDays: 4,
        seatsLeft: 4,
        price: 45000,
        location: 'Hunza Valley',
        image:
          'https://images.unsplash.com/photo-1682685793600-0c1643e66c9d?q=80&w=1200&auto=format&fit=crop',
        tags: ['Departing Today', 'Hotel Package'],
      },
      {
        id: 'skardu-adventure',
        title: 'Skardu Adventure Trek',
        provider: 'Mountain Explorers',
        distanceKm: 410,
        pickupTime: '7:30 AM',
        durationDays: 6,
        seatsLeft: 9,
        price: 69000,
        location: 'Skardu',
        image:
          'https://images.unsplash.com/photo-1469854523086-79265b3b5b57?q=80&w=1200&auto=format&fit=crop',
        tags: ['Departing Tomorrow', 'Tour'],
      },
    ],
    [],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Top chips */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-700">
          <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-500" /> Your Location: {location}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 shadow-sm">
            ⏰ {now}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-white shadow-sm">
            15 trips departing today
          </span>
        </div>

        {/* Hero */}
        <section className="mt-8 text-center">
          <h1 className="text-4xl font-bold md:text-6xl">
            <span className="text-neutral-900">Your Journey Starts</span>{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
              Right Here
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-600 md:text-base">
            See distances, pickup points, and live availability. Feel the trip before you book.
          </p>

          {/* Search panel */}
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border bg-white p-4 shadow-md">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="text-neutral-500">Where are you starting from?</span>
                  <input
                    className="ml-auto w-[160px] border-none p-0 text-neutral-900 focus:outline-none"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="text-neutral-500">Where do you want to go?</span>
                  <input
                    className="ml-auto w-[220px] border-none p-0 text-neutral-900 focus:outline-none"
                    placeholder="e.g., Hunza, Skardu, Nathiagali"
                  />
                </label>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={detectLocation}
                  className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  Detect Location
                </button>
                <Link
                  href="/traveler/discovery"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-white"
                >
                  Find Your Perfect Trip →
                </Link>
              </div>
            </div>
          </div>
          {!user && (
            <div className="mt-4 flex justify-center gap-3">
              <Link href="/auth/login" className="rounded-md border px-4 py-2 text-sm">
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white"
              >
                Sign Up
              </Link>
            </div>
          )}
        </section>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Trips Today', value: 15, icon: '🗺️' },
            { label: 'Available Now', value: 47, icon: '✅' },
            { label: 'Avg Distance', value: '185km', icon: '📍' },
            { label: 'Pickup Points', value: 12, icon: '🚐' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-white p-4 text-center shadow-sm">
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-2 text-2xl font-semibold text-neutral-900">{s.value}</div>
              <div className="text-xs text-neutral-600">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Trips departing section */}
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
                Live Now · Real-time Availability
              </span>
              <h2 className="mt-2 text-lg font-semibold text-neutral-900">
                Trips Departing From Your Location
              </h2>
              <p className="text-sm text-neutral-600">
                See exactly how far, when they leave, and how to get there
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-6">
            {trips.map((t) => (
              <div key={t.id} className="rounded-xl border bg-white shadow-sm">
                <div className="grid gap-0 md:grid-cols-[280px_1fr]">
                  <div className="overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
                    <img src={t.image} alt="trip" className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-full px-2 py-1 text-xs ${
                              tag.includes('Departing')
                                ? 'bg-red-100 text-red-700'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-neutral-500">by {t.provider}</span>
                    </div>

                    <h3 className="mt-2 text-lg font-semibold text-neutral-900">{t.title}</h3>

                    <div className="mt-2 grid gap-2 text-xs text-neutral-700 md:grid-cols-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-md border px-2 py-1">
                          📍 Your Location
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-md border px-2 py-1">
                          🧭 {t.distanceKm} km
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-md border px-2 py-1">
                          🏞️ {t.location}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1">
                          🕓 Pickup {t.pickupTime}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1">
                          📅 {t.durationDays} Days
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-green-700">
                          ✅ {t.seatsLeft} only!
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-neutral-600">
                        Starting from
                        <div className="text-lg font-semibold text-neutral-900">
                          PKR {t.price.toLocaleString()}
                        </div>
                      </div>
                      <Link
                        href="/traveler/discovery"
                        className="rounded-md bg-indigo-600 px-4 py-2 text-white"
                      >
                        Book This Trip →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
