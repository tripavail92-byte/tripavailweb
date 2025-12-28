'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function DashboardSwitcher() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user?.profiles?.length) return null;

  const currentMode = pathname.startsWith('/host')
    ? 'host'
    : pathname.startsWith('/operator')
      ? 'operator'
      : 'traveler';

  const modes = [
    { key: 'traveler', label: 'Browse Travel', href: '/' },
    ...(user.profiles.some((p) => p.providerType === 'HOTEL_MANAGER')
      ? [{ key: 'host', label: 'Host Dashboard', href: '/host' }]
      : []),
    ...(user.profiles.some((p) => p.providerType === 'TOUR_OPERATOR')
      ? [{ key: 'operator', label: 'Operator Dashboard', href: '/operator' }]
      : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {modes.map((mode) => (
        <Link
          key={mode.key}
          href={mode.href}
          className={`rounded-full border px-3 py-1 ${currentMode === mode.key ? 'bg-black text-white' : 'bg-white text-black'}`}
        >
          {mode.label}
        </Link>
      ))}
    </div>
  );
}
