'use client';

import { useState, useEffect } from 'react';

interface Provider {
  id: string;
  businessName: string;
  providerType: 'HOTEL_MANAGER' | 'TOUR_OPERATOR';
  verificationStatus: string;
  createdAt: string;
  user: {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  hotelPackagesCount: number;
  tourPackagesCount: number;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [filter]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filter) params.append('verificationStatus', filter);

      const response = await fetch(`http://localhost:4100/v1/admin/providers?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
        setError(null);
      } else if (response.status === 404) {
        setError('Providers endpoint in development');
        setProviders([]);
      } else {
        setError(`Failed to fetch providers: ${response.statusText}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (providerId: string, currentStatus: string) => {
    const action = currentStatus === 'APPROVED' ? 'reject' : 'approve';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this provider?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4100/v1/admin/providers/${providerId}/toggle-status`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        fetchProviders();
      } else {
        alert('Failed to update provider status');
      }
    } catch (error) {
      alert('Error updating provider status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Provider Management</h1>
        <div className="flex items-center gap-3">
          {error && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">
              ⚠️ {error}
            </div>
          )}
          <div className="text-sm text-neutral-600">Total: {providers.length}</div>
        </div>
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
              <th className="px-4 py-2 text-left text-sm font-semibold">Contact</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Verification</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Packages</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {providers.map((provider) => (
              <tr key={provider.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2 text-sm font-medium">{provider.businessName}</td>
                <td className="px-4 py-2 text-sm">
                  {provider.providerType === 'HOTEL_MANAGER' ? '🏨 Hotel' : '🎒 Tour'}
                </td>
                <td className="px-4 py-2 text-sm">
                  <div>
                    <div className="font-medium">{provider.user.email || 'N/A'}</div>
                    <div className="text-xs text-neutral-600">
                      {provider.user.firstName || provider.user.lastName
                        ? `${provider.user.firstName || ''} ${provider.user.lastName || ''}`.trim()
                        : '—'}
                    </div>
                  </div>
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
                  {provider.hotelPackagesCount + provider.tourPackagesCount}
                </td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(provider.id, provider.verificationStatus)}
                      className={`rounded px-2 py-1 text-xs ${
                        provider.verificationStatus === 'APPROVED'
                          ? 'bg-red-100 hover:bg-red-200'
                          : 'bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {provider.verificationStatus === 'APPROVED' ? 'Reject' : 'Approve'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {providers.length === 0 && !loading && (
        <div className="rounded-lg border bg-white p-6 text-center text-neutral-600">
          No providers found.
        </div>
      )}
    </div>
  );
}
