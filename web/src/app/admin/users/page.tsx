'use client';

import { useState, useEffect } from 'react';
import { Button, TableSkeleton, EmptyState } from '@/components/ui';

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (filter) params.append('role', filter);
      if (search) params.append('search', search);

      const response = await fetch(`http://localhost:4100/v1/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setError(null);
      } else if (response.status === 404) {
        setError('Users endpoint in development');
        setUsers([]); // Stub data
      } else {
        setError(`Failed to fetch users: ${response.statusText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    if (!confirm(`Change role for this user?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4100/v1/admin/users/${userId}/toggle-role`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Failed to update user role');
      }
    } catch (error) {
      alert('Error updating user role');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4100/v1/admin/users/${userId}/delete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      alert('Error deleting user');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="rounded-lg border bg-white shadow-sm">
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <div className="flex items-center gap-3">
          {error && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">
              ⚠️ {error}
            </div>
          )}
          <div className="text-sm text-neutral-600">Total: {users.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">All Roles</option>
          <option value="TRAVELER">Traveler</option>
          <option value="ADMIN">Admin</option>
        </select>
        <Button
          label="Search"
          onClick={fetchUsers}
          variant="primary"
          size="sm"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b bg-neutral-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">Email</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Role</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Created</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2 text-sm font-medium">{user.email || 'N/A'}</td>
                <td className="px-4 py-2 text-sm">
                  {user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : '—'}
                </td>
                <td className="px-4 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex gap-2">
                    <Button
                      label="Toggle Role"
                      onClick={() => handleToggleRole(user.id, user.role)}
                      variant="secondary"
                      size="sm"
                    />
                    <Button
                      label="Delete"
                      onClick={() => handleDelete(user.id)}
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

      {users.length === 0 && !loading && (
        <EmptyState 
          title="No Users Found"
          description="There are no users matching your search."
          icon="👥"
        />
      )}
    </div>
  );
}
