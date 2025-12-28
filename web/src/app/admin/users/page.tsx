'use client';

import { useState } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([
    { id: '1', email: 'user1@example.com', name: 'John Doe', status: 'active', createdAt: '2025-12-01' },
    { id: '2', email: 'user2@example.com', name: 'Jane Smith', status: 'active', createdAt: '2025-12-02' },
  ]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(
    (u) => (!filter || u.status === filter) && u.email.includes(search),
  );

  const handleSuspend = (userId: string) => {
    if (confirm('Suspend this user?')) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, status: 'suspended' } : u)));
    }
  };

  const handleDelete = (userId: string) => {
    if (confirm('Delete this user? This cannot be undone.')) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="text-sm text-neutral-600">Total: {users.length}</div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Created</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2 text-sm">{user.email}</td>
                <td className="px-4 py-2 text-sm">{user.name || '—'}</td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">{user.createdAt}</td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSuspend(user.id)}
                      className="rounded bg-yellow-100 px-2 py-1 text-xs hover:bg-yellow-200"
                    >
                      {user.status === 'active' ? 'Suspend' : 'Restore'}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="rounded bg-red-100 px-2 py-1 text-xs hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="rounded-lg border bg-white p-6 text-center text-neutral-600">
          No users found.
        </div>
      )}
    </div>
  );
}
