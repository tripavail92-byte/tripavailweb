'use client';

import { useState, useEffect } from 'react';

interface Dispute {
  id: string;
  complainant?: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  createdAt: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filter) params.append('status', filter);

      const response = await fetch(`http://localhost:4100/v1/admin/disputes?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDisputes(data.disputes || []);
        setError(null);
      } else if (response.status === 404) {
        setError('Disputes endpoint in development');
        setDisputes([]);
      } else {
        setError(`Failed to fetch disputes: ${response.statusText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (disputeId: string) => {
    if (!confirm('Assign this dispute to yourself?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4100/v1/admin/disputes/${disputeId}/assign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDisputes();
    } catch (error) {
      alert('Error assigning dispute');
    }
  };

  const handleResolve = async (disputeId: string) => {
    if (!confirm('Mark this dispute as resolved?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4100/v1/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDisputes();
    } catch (error) {
      alert('Error resolving dispute');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dispute Management</h1>
        <div className="flex items-center gap-3">
          {error && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">
              ⚠️ {error}
            </div>
          )}
          <div className="text-sm text-neutral-600">Open: {disputes.filter((d) => d.status === 'open').length}</div>
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
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Created</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {disputes.map((dispute) => (
              <tr key={dispute.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2 text-sm font-mono">{dispute.id}</td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      dispute.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : dispute.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {dispute.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">{new Date(dispute.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex gap-2">
                    {dispute.status === 'open' && (
                      <button
                        onClick={() => handleAssign(dispute.id)}
                        className="rounded bg-blue-100 px-2 py-1 text-xs hover:bg-blue-200"
                      >
                        Assign
                      </button>
                    )}
                    {dispute.status !== 'resolved' && (
                      <button
                        onClick={() => handleResolve(dispute.id)}
                        className="rounded bg-green-100 px-2 py-1 text-xs hover:bg-green-200"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {disputes.length === 0 && !loading && (
        <div className="rounded-lg border bg-white p-6 text-center text-neutral-600">
          No disputes found.
        </div>
      )}
    </div>
  );
}
