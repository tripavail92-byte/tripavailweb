'use client';

import Link from 'next/link';
import { DashboardSwitcher } from '@/app/components/DashboardSwitcher';
import { useAuth } from '@/hooks/useAuth';

export default function TravelerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-semibold">
              TripAvail
            </Link>
            <nav className="flex items-center gap-3 text-sm text-neutral-600">
              <Link href="/">Home</Link>
              <Link href="/tours">Tours</Link>
              <Link href="/stays">Stays</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-700">
            {user ? <span>{user.email}</span> : <span>Guest</span>}
            <DashboardSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
