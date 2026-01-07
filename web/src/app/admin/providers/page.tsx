'use client';

import { useState, useEffect } from 'react';
import {
  getProviderReviewQueue,
  approveProvider,
  rejectProvider,
  ProviderReviewItem,
} from '@/lib/api-client';
import { formatApiError } from '@/lib/error-utils';
import { ErrorToast } from '@/app/components/ErrorToast';
import { Button } from '@/components/ui';
import { TableSkeleton, EmptyState } from '@/components/ui';

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<ProviderReviewItem[]>([]);
  const [filter, setFilter] = useState<'' | 'UNDER_REVIEW' | 'SUBMITTED' | 'REJECTED' | 'APPROVED'>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  useEffect(() => {
    fetchProviders();
  }, [filter]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await getProviderReviewQueue(filter || undefined);
      setProviders(response.providers || []);
      setError(null);
    } catch (error) {
      setError(error);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (providerId: string) => {
    try {
      await approveProvider(providerId);
      fetchProviders();
    } catch (err) {
      setError(err);
    }
  };

  const handleReject = async (providerId: string) => {
    const reason = prompt('Enter rejection reason');
    if (!reason) return;
    try {
      await rejectProvider(providerId, reason);
      fetchProviders();
    } catch (err) {
      setError(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Provider Management</h1>
        <div className="rounded-lg border bg-white shadow-sm">
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error != null && (
        <ErrorToast 
          error={error} 
          message={formatApiError(error)}
          onDismiss={() => setError(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Provider Management</h1>
        <div className="text-sm text-neutral-600">Total: {providers.length}</div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="SUBMITTED">Submitted</option>
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
              <th className="px-4 py-2 text-left text-sm font-semibold">Submitted</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Reason</th>
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
                    <div className="font-medium">{provider.user?.email || 'N/A'}</div>
                    <div className="text-xs text-neutral-600">
                      {provider.user?.firstName || provider.user?.lastName
                        ? `${provider.user?.firstName || ''} ${provider.user?.lastName || ''}`.trim()
                        : '—'}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      provider.verificationStatus === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : provider.verificationStatus === 'UNDER_REVIEW' || provider.verificationStatus === 'SUBMITTED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {provider.verificationStatus}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {provider.submittedAt ? new Date(provider.submittedAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-2 text-sm text-neutral-700">
                  {provider.rejectionReason ? (
                    <span className="text-red-700">{provider.rejectionReason}</span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-2 text-sm">
                  {typeof (provider as any).hotelPackagesCount === 'number'
                    ? (provider as any).hotelPackagesCount + ((provider as any).tourPackagesCount || 0)
                    : '—'}
                </td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex gap-2">
                    <Button
                      label="Approve"
                      onClick={() => handleApprove(provider.id)}
                      variant="primary"
                      size="sm"
                      disabled={provider.verificationStatus === 'APPROVED'}
                    />
                    <Button
                      label="Reject"
                      onClick={() => handleReject(provider.id)}
                      variant="danger"
                      size="sm"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {providers.length === 0 && !loading && (
        <EmptyState 
          title="No Providers Found"
          description="There are no providers matching your filter."
          icon="📋"
        />
      )}
    </div>
  );
}
