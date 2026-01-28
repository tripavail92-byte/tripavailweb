'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useUserStore } from '@/store/useUserStore';

const roles = [
  {
    id: 'hotel_manager',
    title: 'Hotel Manager',
    icon: '🏨',
    description: 'List properties, manage room inventory, and receive bookings seamlessly.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'tour_operator',
    title: 'Tour Operator',
    icon: '🚐',
    description: 'Create tour listings, manage itineraries, and share experiences.',
    color: 'from-blue-500 to-cyan-500',
  },
];

export function BecomePartnerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedRole, setSelectedRole] = useState<'hotel_manager' | 'tour_operator' | null>(null);
  const router = useRouter();
  const { setActiveRole } = useUserStore();

  const handleRoleSelect = (roleId: 'hotel_manager' | 'tour_operator') => {
    setSelectedRole(roleId);
  };

  const handleContinue = () => {
    if (!selectedRole) return;

    // Map internal ID to store role
    const mapRole = selectedRole === 'hotel_manager' ? 'host' : 'operator';
    setActiveRole(mapRole);

    const dashboardUrl = selectedRole === 'hotel_manager'
      ? '/host/dashboard'
      : '/operator/dashboard';

    router.push(dashboardUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Become a Partner</h2>
          <p className="mt-2 text-gray-600">Choose how you'd like to monetize with TripAvail</p>
        </div>

        {/* Role Selection Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id as 'hotel_manager' | 'tour_operator')}
              className={`rounded-lg border-2 p-8 text-left transition ${selectedRole === role.id
                ? 'border-gray-900 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div className="mb-4 text-4xl">{role.icon}</div>
              <h3 className="text-xl font-bold text-gray-900">{role.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{role.description}</p>

              {selectedRole === role.id && (
                <div className="mt-6">
                  <div
                    className={`inline-block rounded-lg bg-gradient-to-r ${role.color} px-4 py-2 text-sm font-semibold text-white`}
                  >
                    ✓ Selected
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            disabled={!selectedRole}
            onClick={handleContinue}
            className={`flex-1 rounded-lg bg-gradient-to-r px-4 py-3 text-center font-semibold text-white transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${selectedRole === 'hotel_manager'
              ? 'from-amber-500 to-orange-500'
              : selectedRole === 'tour_operator'
                ? 'from-blue-500 to-cyan-500'
                : 'from-gray-400 to-gray-500'
              }`}
          >
            Continue {selectedRole ? `as ${selectedRole === 'hotel_manager' ? 'Hotel Manager' : 'Tour Operator'}` : ''}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
