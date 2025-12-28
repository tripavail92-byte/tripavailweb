'use client';

import { useState } from 'react';

interface Dispute {
  id: string;
  complainant: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([
    {
      id: 'D001',
      complainant: 'user@example.com',
      type: 'Cancellation',
      priority: 'high',
      status: 'open',
      createdAt: '2025-12-25',
    },
    {
      id: 'D002',
      complainant: 'provider@example.com',
      type: 'Payment',
      priority: 'urgent',
      status: 'in-progress',
      createdAt: '2025-12-26',
    },
  ]);
  const [filter, setFilter] = useState('');

  const filteredDisputes = disputes.filter((d) => !filter || d.status === filter);

  const handleAssign = (disputeId: string) => {
    setDisputes(
      disputes.map((d) => (d.id === disputeId ? { ...d, status: 'in-progress' } : d)),
    );
  };

  const handleResolve = (disputeId: string) => {
    setDisputes(
      disputes.map((d) => (d.id === disputeId ? { ...d, status: 'resolved' } : d)),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dispute Management</h1>
        <div className="text-sm text-neutral-600">Open: {disputes.filter((d) => d.status === 'open').length}</div>
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
              <th className="px-4 py-2 text-left text-sm font-semibold">Complainant</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Priority</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Created</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredDisputes.map((dispute) => (
              <tr key={dispute.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2 text-sm font-mono">{dispute.id}</td>
                <td className="px-4 py-2 text-sm">{dispute.complainant}</td>
                <td className="px-4 py-2 text-sm">{dispute.type}</td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      dispute.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : dispute.priority === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : dispute.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {dispute.priority.toUpperCase()}
                  </span>
                </td>
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
                <td className="px-4 py-2 text-sm">{dispute.createdAt}</td>
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

      {filteredDisputes.length === 0 && (
        <div className="rounded-lg border bg-white p-6 text-center text-neutral-600">
          No disputes found.
        </div>
      )}
    </div>
  );
}
