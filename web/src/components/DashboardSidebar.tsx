'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/app/providers';
import { BecomePartnerModal } from '@/components/BecomePartnerModal';
import { useRoleNavigation } from '@/hooks/useRoleNavigation';

export function DashboardSidebar() {
  const { user } = useAuthContext();
  const { activeRole, drawerItems } = useRoleNavigation();
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  // Helper to determine display name/avatar
  const getProfileDisplay = () => {
    if (activeRole === 'host') {
      const hotelProfile = user?.profiles?.find(p => p.providerType === 'HOTEL_MANAGER');
      return {
        initial: 'H',
        name: hotelProfile?.businessName || 'Hotel Manager',
        email: user?.email || 'hotel@example.com',
        color: 'from-amber-500 to-orange-600',
        verificationStatus: hotelProfile?.verificationStatus
      };
    }
    if (activeRole === 'operator') {
      const operatorProfile = user?.profiles?.find(p => p.providerType === 'TOUR_OPERATOR');
      return {
        initial: 'O',
        name: operatorProfile?.businessName || 'Tour Operator',
        email: user?.email || 'operator@example.com',
        color: 'from-emerald-500 to-teal-600',
        verificationStatus: operatorProfile?.verificationStatus
      };
    }
    // Traveler (default)
    return {
      initial: user?.email?.charAt(0).toUpperCase() || 'U',
      name: user?.email?.split('@')[0] || 'Traveler',
      email: user?.email || 'user@example.com',
      color: 'from-blue-500 to-purple-600',
      verificationStatus: null
    };
  };

  const profile = getProfileDisplay();

  return (
    <aside className="w-72 border-r border-gray-200 bg-white">
      <div className="flex h-screen flex-col">
        {/* Profile Section */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${profile.color} text-lg font-bold text-white`}>
              {profile.initial}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 line-clamp-1">
                  {profile.name}
                </h3>
              </div>
              <p className="text-xs text-gray-500 truncate">{profile.email}</p>

              {/* Host/Operator Verification Tag */}
              {profile.verificationStatus && (
                <p className="mt-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold 
                    ${profile.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                      profile.verificationStatus === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'}`}>
                    {profile.verificationStatus.replace(/_/g, ' ')}
                  </span>
                </p>
              )}

              {/* Traveler Phone (Only for traveler) */}
              {activeRole === 'traveler' && user?.phone && (
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-600">
                  <span>📍</span> {user.phone}
                </p>
              )}
            </div>
          </div>

          {/* Profile Completion (Traveler Only) */}
          {activeRole === 'traveler' && (
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
          )}
        </div>

        {/* Dynamic Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {drawerItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Dynamic CTA Section */}
        <div className="border-t border-gray-200 p-4">

          {/* Host CTA */}
          {activeRole === 'host' && (
            <>
              <div className="mb-4 rounded-lg bg-amber-50 p-4">
                <p className="text-xs font-semibold text-gray-700">Properties Active</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">2</p>
              </div>
              <Link
                href="/host/packages/create"
                className="block rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-amber-200"
              >
                + Create Package
              </Link>
            </>
          )}

          {/* Operator CTA */}
          {activeRole === 'operator' && (
            <>
              <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                <p className="text-xs font-semibold text-gray-700">Active Tours</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">4</p>
              </div>
              <Link
                href="/operator/tours/create"
                className="block rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-emerald-200"
              >
                + Create Tour
              </Link>
            </>
          )}

          {/* Traveler CTA */}
          {activeRole === 'traveler' && (
            <button
              onClick={() => setIsPartnerModalOpen(true)}
              className="block w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-4 text-center text-sm font-semibold text-white transition hover:shadow-lg hover:shadow-pink-200"
            >
              <div>Become a Partner</div>
              <div className="text-xs font-normal text-white/90">
                Join TripAvail and grow your business
              </div>
            </button>
          )}

          {/* Version */}
          <div className="mt-4 text-center text-xs text-gray-400">Version 1.0.0 · Made with ❤️</div>
        </div>

        {/* Modal (Only relevant for Traveler view) */}
        <BecomePartnerModal
          isOpen={isPartnerModalOpen}
          onClose={() => setIsPartnerModalOpen(false)}
        />
      </div>
    </aside>
  );
}
