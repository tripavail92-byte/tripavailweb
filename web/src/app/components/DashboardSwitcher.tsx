'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/store/useUserStore';

export function DashboardSwitcher() {
  const { user } = useAuth();
  const pathname = usePathname();

  type Mode = 'traveler' | 'host' | 'operator';
  const [activeMode, setActiveMode] = useState<Mode>('traveler');

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('activeDashboard') : null;
    if (stored === 'host' || stored === 'operator' || stored === 'traveler') {
      setActiveMode(stored);
    }
  }, []);

  const pathMode: Mode = pathname.startsWith('/host')
    ? 'host'
    : pathname.startsWith('/operator')
      ? 'operator'
      : 'traveler';

  useEffect(() => {
    setActiveMode(pathMode);
  }, [pathMode]);

  const currentMode: Mode = pathMode || activeMode;

  const isHotelManager = !!user?.profiles?.some((p) => p.providerType === 'HOTEL_MANAGER');
  const isTourOperator = !!user?.profiles?.some((p) => p.providerType === 'TOUR_OPERATOR');

  const modes = [
    { key: 'traveler', label: 'Browse Travel', href: '/' },
    ...(isHotelManager ? [{ key: 'host', label: 'Host Dashboard', href: '/host' }] : []),
    ...(isTourOperator ? [{ key: 'operator', label: 'Operator Dashboard', href: '/operator' }] : []),
  ];

  if (!user?.profiles?.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {modes.map((mode) => (
        <Link
          key={mode.key}
          href={mode.href}
          onClick={() => {
            const modeKey = mode.key as Mode;
            // Trigger 3D Flip Animation
            useUserStore.getState().startFlip();
            useUserStore.getState().setActiveRole(modeKey);

            // Keep local state for immediate UI feedback (optional)
            setActiveMode(modeKey);
          }}
          className={`rounded-full border px-3 py-1 ${currentMode === mode.key ? 'bg-black text-white' : 'bg-white text-black'}`}
        >
          {mode.label}
        </Link>
      ))}
    </div>
  );
}
