'use client';

import Link from 'next/link';
import { DashboardSwitcher } from '@/app/components/DashboardSwitcher';
import { useAuthContext } from '@/app/providers';

export default function TravelerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl">
              ✈️ TripAvail
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link href="/traveler/discovery" className="text-neutral-600 hover:text-neutral-900">
                Discover
              </Link>
              <Link href="/traveler/bookings" className="text-neutral-600 hover:text-neutral-900">
                My Bookings
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {user && <span className="text-neutral-700">{user.email}</span>}
            <DashboardSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
