'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BecomePartnerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [selectedRole, setSelectedRole] = useState<'hotel_manager' | 'tour_operator' | null>(null);
  const router = useRouter();

  const roles = [
    {
      id: 'hotel_manager',
      icon: '🏨',
      title: 'Hotel Manager',
      description: 'Manage hotel properties and hotel packages',
      color: 'from-amber-500 to-orange-500',
      dashboardUrl: '/host/dashboard',
    },
    {
      id: 'tour_operator',
      icon: '🚌',
      title: 'Tour Operator',
      description: 'Create and manage tour packages',
      color: 'from-blue-500 to-cyan-500',
      dashboardUrl: '/operator/dashboard',
    },
  ];

  const handleRoleSelect = (roleId: 'hotel_manager' | 'tour_operator') => {
    setSelectedRole(roleId);
    // In a real app, this would call an API to update user role
    // For now, we'll redirect directly
    const dashboardUrl = roles.find((r) => r.id === roleId)?.dashboardUrl;
    if (dashboardUrl) {
      router.push(dashboardUrl);
      onClose();
    }
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
              className={`rounded-lg border-2 p-8 text-left transition ${
                selectedRole === role.id
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
          {selectedRole && (
            <button
              onClick={() => {
                const dashboardUrl = roles.find((r) => r.id === selectedRole)?.dashboardUrl;
                if (dashboardUrl) {
                  router.push(dashboardUrl);
                  onClose();
                }
              }}
              className={`flex-1 rounded-lg bg-gradient-to-r ${
                selectedRole === 'hotel_manager'
                  ? 'from-amber-500 to-orange-500'
                  : 'from-blue-500 to-cyan-500'
              } px-4 py-3 text-center font-semibold text-white transition hover:shadow-lg`}
            >
              Continue as {selectedRole === 'hotel_manager' ? 'Hotel Manager' : 'Tour Operator'}
            </button>
          )}
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
