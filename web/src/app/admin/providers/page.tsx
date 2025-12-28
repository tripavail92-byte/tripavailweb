'use client';

import { useState } from 'react';

interface Provider {
  id: string;
  name: string;
  type: 'HOTEL_MANAGER' | 'TOUR_OPERATOR';
  verificationStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
  status: 'active' | 'suspended';
  listings: number;
  createdAt: string;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([
    {
      id: '1',
      name: 'Sunset Hotel',
      type: 'HOTEL_MANAGER',
      verificationStatus: 'PENDING',
      status: 'active',
      listings: 5,
      createdAt: '2025-12-10',
    },
    {
      id: '2',
      name: 'Mountain Tours Co',
      type: 'TOUR_OPERATOR',
      verificationStatus: 'APPROVED',
      status: 'active',
      listings: 12,
      createdAt: '2025-12-05',
    },
  ]);
  const [filter, setFilter] = useState('');

  const filteredProviders = providers.filter(
    (p) => !filter || p.verificationStatus === filter,
  );

  const handleApprove = (providerId: string) => {
    setProviders(
      providers.map((p) =>
        p.id === providerId ? { ...p, verificationStatus: 'APPROVED' } : p,
      ),
    );
  };

  const handleSuspend = (providerId: string) => {
    if (confirm('Suspend this provider?')) {
      setProviders(
        providers.map((p) =>
          p.id === providerId ? { ...p, status: 'suspended' } : p,
        ),
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Provider Management</h1>
        <div className="text-sm text-neutral-600">Total: {providers.length}</div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">Business Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Verification</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Listings</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProviders.map((provider) => (
              <tr key={provider.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2 text-sm font-medium">{provider.name}</td>
                <td className="px-4 py-2 text-sm">
                  {provider.type === 'HOTEL_MANAGER' ? '🏨 Hotel' : '🎒 Tour'}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      provider.verificationStatus === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : provider.verificationStatus === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {provider.verificationStatus}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      provider.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {provider.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">{provider.listings}</td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex gap-2">
                    {provider.verificationStatus === 'PENDING' && (
                      <button
                        onClick={() => handleApprove(provider.id)}
                        className="rounded bg-green-100 px-2 py-1 text-xs hover:bg-green-200"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleSuspend(provider.id)}
                      className="rounded bg-yellow-100 px-2 py-1 text-xs hover:bg-yellow-200"
                    >
                      {provider.status === 'active' ? 'Suspend' : 'Restore'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProviders.length === 0 && (
        <div className="rounded-lg border bg-white p-6 text-center text-neutral-600">
          No providers found.
        </div>
      )}
    </div>
  );
}
