'use client';

import { useState } from 'react';

interface AuditEntry {
  id: string;
  admin: string;
  action: string;
  resourceType: string;
  resourceId: string;
  status: 'success' | 'failure';
  timestamp: string;
}

export default function AdminAuditLogPage() {
  const [entries] = useState<AuditEntry[]>([
    {
      id: '1',
      admin: 'admin@tripavail.com',
      action: 'suspend_user',
      resourceType: 'user',
      resourceId: 'user_123',
      status: 'success',
      timestamp: '2025-12-26 14:32:15',
    },
    {
      id: '2',
      admin: 'admin@tripavail.com',
      action: 'approve_kyc',
      resourceType: 'provider',
      resourceId: 'provider_456',
      status: 'success',
      timestamp: '2025-12-26 13:45:20',
    },
    {
      id: '3',
      admin: 'admin@tripavail.com',
      action: 'delete_provider',
      resourceType: 'provider',
      resourceId: 'provider_789',
      status: 'success',
      timestamp: '2025-12-26 12:10:05',
    },
  ]);
  const [search, setSearch] = useState('');

  const filteredEntries = entries.filter(
    (e) =>
      e.admin.includes(search) ||
      e.action.includes(search) ||
      e.resourceId.includes(search),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <div className="text-sm text-neutral-600">Total: {entries.length}</div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by admin, action, or resource..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded border px-3 py-2 text-sm"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">Admin</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Action</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Resource Type</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Resource ID</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2 text-sm">{entry.admin}</td>
                <td className="px-4 py-2 text-sm font-mono">{entry.action}</td>
                <td className="px-4 py-2 text-sm">{entry.resourceType}</td>
                <td className="px-4 py-2 text-sm font-mono">{entry.resourceId}</td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      entry.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {entry.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-neutral-600">{entry.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEntries.length === 0 && (
        <div className="rounded-lg border bg-white p-6 text-center text-neutral-600">
          No audit entries found.
        </div>
      )}
    </div>
  );
}
