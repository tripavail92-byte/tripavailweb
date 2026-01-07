'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSwitcher } from '@/app/components/DashboardSwitcher';

export default function BecomePartnerPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState<'HOTEL_MANAGER' | 'TOUR_OPERATOR' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startFlow = async (providerType: 'HOTEL_MANAGER' | 'TOUR_OPERATOR') => {
    try {
      setBusy(providerType);
      setError(null);
      // Redirect directly to dashboard
      if (providerType === 'HOTEL_MANAGER') {
        router.push('/host/dashboard');
      } else {
        router.push('/operator/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to start onboarding';
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">Become a Partner</h1>
            <p className="text-sm text-neutral-600">Choose how you want to earn on TripAvail.</p>
          </div>
          <DashboardSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !user && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-neutral-700">Please log in to start onboarding.</p>
            <Link
              href="/auth/login"
              className="mt-2 inline-block rounded-md bg-black px-4 py-2 text-white"
            >
              Login or create account
            </Link>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Hotel Manager</h2>
              <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs">
                Rooms & packages
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-700">
              Onboard your property once. Reuse rooms, amenities, and policies to publish hotel
              packages fast.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-neutral-700">
              <li>• 7-step Airbnb-style property setup</li>
              <li>• Draft listings allowed while under review</li>
              <li>• Publish packages after approval</li>
            </ul>
            <button
              onClick={() => startFlow('HOTEL_MANAGER')}
              disabled={busy !== null || !user}
              className="mt-4 rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
            >
              {busy === 'HOTEL_MANAGER' ? 'Loading…' : 'Start Hotel Onboarding'}
            </button>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Tour Operator</h2>
              <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs">
                Tours & departures
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-700">
              Build 14-step tour itineraries with pickups, departures, add-ons, and compliance in
              one flow.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-neutral-700">
              <li>• Draft tours and departures</li>
              <li>• Publish after verification</li>
              <li>• Supports templates and add-ons</li>
            </ul>
            <button
              onClick={() => startFlow('TOUR_OPERATOR')}
              disabled={busy !== null || !user}
              className="mt-4 rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
            >
              {busy === 'TOUR_OPERATOR' ? 'Loading…' : 'Start Operator Onboarding'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
