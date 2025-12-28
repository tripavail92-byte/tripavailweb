'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { DashboardSwitcher } from '@/app/components/DashboardSwitcher';
import { VerificationBanner } from '@/app/components/VerificationBanner';
import { useAuth } from '@/hooks/useAuth';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  const operatorProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'TOUR_OPERATOR') || null,
    [user],
  );

  if (loading) return <div className="p-4">Loading session...</div>;

  if (!operatorProfile) {
    return (
      <div className="p-6">
        <DashboardSwitcher />
        <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
          <h1 className="text-xl font-semibold">Become a tour operator</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Create your tour operator profile to unlock the Operator dashboard and publish tours.
          </p>
          <Link href="/operator/onboarding" className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-white">
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
            <Link href="/operator" className="font-semibold">
              Operator Dashboard
            </Link>
            <nav className="flex items-center gap-3 text-sm text-neutral-700">
              <Link href="/operator/onboarding">Onboarding</Link>
              <Link href="/operator/tours">Tours</Link>
              <Link href="/operator/departures">Departures</Link>
            </nav>
          </div>
          <DashboardSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <VerificationBanner profile={operatorProfile} />
        {children}
      </main>
    </div>
  );
}
