'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { DashboardSwitcher } from '@/app/components/DashboardSwitcher';
import { VerificationBanner } from '@/app/components/VerificationBanner';
import { useAuth } from '@/hooks/useAuth';

// Force dynamic rendering - layout uses auth
export const dynamic = 'force-dynamic';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  const hotelProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'HOTEL_MANAGER') || null,
    [user],
  );

  if (loading) {
    return <div className="p-4">Loading session...</div>;
  }

  // Allow onboarding to work before profile exists
  if (!hotelProfile) {
    return <>{children}</>;
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
