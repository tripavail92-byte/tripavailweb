'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/providers', label: 'Providers', icon: '🏨' },
  { href: '/admin/bookings', label: 'Bookings', icon: '📋' },
  { href: '/admin/disputes', label: 'Disputes', icon: '⚠️' },
  { href: '/admin/audit-log', label: 'Audit Log', icon: '📝' },
  { href: '/admin/content', label: 'Content', icon: '📄' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  // Check if user is admin (stub for now)
  const isAdmin = user?.role === 'ADMIN' || user?.email?.includes('admin');

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-50">
        <div className="rounded-lg border bg-white p-6 text-center shadow-sm max-w-md">
          <h1 className="text-xl font-semibold text-red-700">Access Denied</h1>
          <p className="mt-2 text-sm text-neutral-600">You do not have admin access.</p>
          <p className="mt-4 text-xs text-neutral-500">
            {user ? `Logged in as: ${user.email} (${user.role})` : 'Not logged in'}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/auth/login" className="rounded bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700">
              Login with Admin Account
            </Link>
            <Link href="/" className="rounded bg-black px-4 py-2 text-white text-sm">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white shadow-sm">
        <div className="border-b p-4">
          <h1 className="text-lg font-bold">TripAvail Admin</h1>
          <p className="text-xs text-neutral-600">{user?.email}</p>
        </div>
        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition ${
                pathname === item.href
                  ? 'bg-black text-white'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-auto">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold capitalize">
              {pathname === '/admin' ? 'Dashboard' : pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
            <button
              onClick={() => (window.location.href = '/')}
              className="rounded border px-3 py-1 text-sm hover:bg-neutral-100"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
