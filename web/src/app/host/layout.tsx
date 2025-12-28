'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { DashboardSwitcher } from '@/app/components/DashboardSwitcher';
import { VerificationBanner } from '@/app/components/VerificationBanner';
import { useAuth } from '@/hooks/useAuth';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  const hotelProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'HOTEL_MANAGER') || null,
    [user],
  );

  if (loading) {
    return <div className="p-4">Loading session...</div>;
  }

  if (!hotelProfile) {
    return (
      <div className="p-6">
        <DashboardSwitcher />
        <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
          <h1 className="text-xl font-semibold">Become a hotel partner</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Create your provider profile to unlock the Host dashboard and publish hotel packages.
          </p>
          <Link
            href="/host/onboarding"
            className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-white"
          >
            Start onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/host" className="font-semibold">
              Host Dashboard
            </Link>
            <nav className="flex items-center gap-3 text-sm text-neutral-700">
              <Link href="/host">Dashboard</Link>
              <Link href="/host/onboarding">Onboarding</Link>
              <Link href="/host/properties">Properties</Link>
              <Link href="/host/packages">Hotel Packages</Link>
            </nav>
          </div>
          <DashboardSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <VerificationBanner profile={hotelProfile} />
        {children}
      </main>
    </div>
  );
}
