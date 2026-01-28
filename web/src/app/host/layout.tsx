'use client';

import Link from 'next/link';
import { useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { DashboardSwitcher } from '@/app/components/DashboardSwitcher';
import { PartnerStatusBanner } from '@/app/components/PartnerStatusBanner';
import { useAuth } from '@/hooks/useAuth';
import { HostDashboardLayout } from '@/components/HostDashboardLayout';

// Force dynamic rendering - layout uses auth
export const dynamic = 'force-dynamic';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const hotelProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'HOTEL_MANAGER') || null,
    [user],
  );
  const operatorProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'TOUR_OPERATOR') || null,
    [user],
  );

  const isOnboardingRoute = pathname?.startsWith('/host/onboarding');

  useEffect(() => {
    if (!loading && !hotelProfile && !isOnboardingRoute && !operatorProfile) {
      router.replace('/become-a-partner');
    }
  }, [loading, hotelProfile, isOnboardingRoute, operatorProfile, router]);

  if (loading) {
    return <div className="p-4">Loading session...</div>;
  }

  if (!hotelProfile) {
    if (isOnboardingRoute) return <>{children}</>;

    if (operatorProfile) {
      return (
        <div className="p-6">
          <DashboardSwitcher />
          <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
            <h1 className="text-xl font-semibold">Host dashboard requires a hotel profile</h1>
            <p className="mt-2 text-sm text-neutral-600">
              You currently have a tour operator profile. Switch dashboards or start hotel onboarding.
            </p>
            <div className="mt-4 flex gap-3">
              <Link href="/operator" className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50">
                Go to Operator Dashboard
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

  // Success view (Host Dashboard)
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/host" className="font-semibold">
              Host Dashboard
            </Link>
          </div>
          <DashboardSwitcher /> // Keep switcher on mobile header
        </div>
      </header>
      {/* Desktop uses Sidebar via HostDashboardLayout logic */}
      <div className="flex">
        <div className="hidden lg:block">
          {/* Sidebar is rendered by HostDashboardLayout wrapper in next iteration, 
               but here we are inside layout.tsx which usually WRAPS pages. 
               We need to use the HostDashboardLayout component. 
               Wait, HostDashboardLayout IS a wrapper. */}
        </div>
      </div>

      {/* 
         CORRECT APPROACH: 
         Replace the entire return with HostDashboardLayout.
      */}
      <HostDashboardLayout>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <PartnerStatusBanner profile={hotelProfile} />
          {children}
        </div>
      </HostDashboardLayout>
    </div>
  );
}
