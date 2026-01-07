'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/app/providers';
import { BecomePartnerModal } from '@/components/BecomePartnerModal';

export function DashboardSidebar() {
  const { user } = useAuthContext();
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/traveler/dashboard' },
    { icon: '👤', label: 'My Profile', href: '/traveler/profile' },
    { icon: '📍', label: 'My Trips', href: '/traveler/trips', badge: '2 upcoming' },
    { icon: '❤️', label: 'Wishlist', href: '/traveler/wishlist', badge: '12 saved' },
    { icon: '💳', label: 'Payment Methods', href: '/traveler/payments' },
    { icon: '⚙️', label: 'Account Settings', href: '/traveler/settings' },
    { icon: '❓', label: 'Help & Support', href: '/traveler/support' },
  ];

  return (
    <aside className="w-72 border-r border-gray-200 bg-white">
      <div className="flex h-screen flex-col">
        {/* Profile Section */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">
                  {user?.email?.split('@')[0] || 'Traveler'}
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
              <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
              {user?.phone && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                  <span>📍</span> {user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Profile Completion */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Profile Completion</span>
              <span className="text-xs font-bold text-pink-500">40%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
                style={{ width: '40%' }}
              />
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && <span className="text-xs text-gray-500">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        {/* Partner CTA */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => setIsPartnerModalOpen(true)}
            className="block w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-4 text-center text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-pink-200"
          >
            <div>Become a Partner</div>
            <div className="text-xs font-normal text-white/90">
              Join TripAvail and grow your business
            </div>
          </button>

          {/* Version */}
          <div className="mt-4 text-center text-xs text-gray-400">Version 1.0.0 · Made with ❤️</div>
        </div>

        {/* Modal */}
        <BecomePartnerModal
          isOpen={isPartnerModalOpen}
          onClose={() => setIsPartnerModalOpen(false)}
        />
      </div>
    </aside>
  );
}
