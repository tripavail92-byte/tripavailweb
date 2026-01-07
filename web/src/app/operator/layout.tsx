'use client';

import Link from 'next/link';
import { useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DashboardSwitcher } from '@/app/components/DashboardSwitcher';
import { PartnerStatusBanner } from '@/app/components/PartnerStatusBanner';
import { useAuth } from '@/hooks/useAuth';

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const operatorProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'TOUR_OPERATOR') || null,
    [user],
  );
  const hotelProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'HOTEL_MANAGER') || null,
    [user],
  );

  const isOnboardingRoute = pathname?.startsWith('/operator/onboarding');

  useEffect(() => {
    if (!loading && !operatorProfile && !isOnboardingRoute && !hotelProfile) {
      router.replace('/become-a-partner');
    }
  }, [loading, operatorProfile, isOnboardingRoute, hotelProfile, router]);

  if (loading) return <div className="p-4">Loading session...</div>;

  if (!operatorProfile) {
    if (isOnboardingRoute) {
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

    if (hotelProfile) {
      return (
        <div className="p-6">
          <DashboardSwitcher />
          <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
            <h1 className="text-xl font-semibold">Operator dashboard requires a tour operator profile</h1>
            <p className="mt-2 text-sm text-neutral-600">
              You currently have a hotel profile. Switch dashboards or start operator onboarding.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/host" className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50">
                Go to Host Dashboard
              </Link>
              <Link href="/become-a-partner" className="rounded-md bg-black px-4 py-2 text-sm text-white">
                Become a Partner
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return null;
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
              <Link href="/operator/profile">Profile</Link>
              <Link href="/operator/tours">Tours</Link>
              <Link href="/operator/departures">Departures</Link>
            </nav>
          </div>
          <DashboardSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <PartnerStatusBanner profile={operatorProfile} />
        {children}
      </main>
    </div>
  );
}
