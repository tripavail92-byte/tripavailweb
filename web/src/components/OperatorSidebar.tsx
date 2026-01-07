'use client';

import Link from 'next/link';
import { useAuthContext } from '@/app/providers';

export function OperatorSidebar() {
  const { user } = useAuthContext();

  // Get operator profile from user
  const operatorProfile = user?.profiles?.[0];

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/operator/dashboard' },
    { icon: '🚌', label: 'List Your Tours', href: '/operator/onboarding' },
    { icon: '�🚌', label: 'Tours', href: '/operator/tours' },
    { icon: '📅', label: 'Departures', href: '/operator/departures' },
    { icon: '📅', label: 'Bookings', href: '/operator/bookings' },
    { icon: '📈', label: 'Analytics', href: '/operator/analytics' },
    { icon: '⚙️', label: 'Settings', href: '/operator/settings' },
    { icon: '❓', label: 'Help & Support', href: '/operator/support' },
  ];

  return (
    <aside className="w-72 border-r border-gray-200 bg-white">
      <div className="flex h-screen flex-col">
        {/* Profile Section */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-lg font-bold text-white">
              {user?.email?.charAt(0).toUpperCase() || 'O'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {operatorProfile?.businessName || 'Tour Operator'}
                </h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500">{user?.email || 'operator@example.com'}</p>
              {operatorProfile?.verificationStatus && (
                <p className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      operatorProfile.verificationStatus === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : operatorProfile.verificationStatus === 'IN_PROGRESS'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {operatorProfile.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-4 rounded-lg bg-blue-50 p-4">
            <p className="text-xs font-semibold text-gray-700">Tours Active</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">3</p>
          </div>

          {/* CTA */}
          <Link
            href="/operator/tours/create"
            className="block rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-blue-200"
          >
            + Create Tour
          </Link>

          {/* Version */}
          <div className="mt-4 text-center text-xs text-gray-400">Version 1.0.0 · Made with ❤️</div>
        </div>
      </div>
    </aside>
  );
}
