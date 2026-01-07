'use client';

import Link from 'next/link';
import { useAuthContext } from '@/app/providers';

export function AdminSidebar() {
  const { user } = useAuthContext();

  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/admin/dashboard' },
    {
      icon: '✅',
      label: 'Verification Queue',
      href: '/admin/verification',
      subtitle: 'Pending providers',
    },
    { icon: '⚠️', label: 'Disputes', href: '/admin/disputes', subtitle: 'Active disputes' },
    { icon: '💳', label: 'Payments', href: '/admin/payments', subtitle: 'Transaction logs' },
    { icon: '💰', label: 'Payouts', href: '/admin/payouts', subtitle: 'Provider payouts' },
    { icon: '📈', label: 'Analytics', href: '/admin/analytics', subtitle: 'Platform metrics' },
    { icon: '👥', label: 'Users', href: '/admin/users', subtitle: 'All users' },
    { icon: '⚙️', label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <aside className="w-72 border-r border-gray-200 bg-white">
      <div className="flex h-screen flex-col">
        {/* Profile Section */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 text-lg font-bold text-white">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Administrator</h3>
                <span className="inline-block rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">
                  Admin
                </span>
              </div>
              <p className="text-xs text-gray-500">{user?.email || 'admin@tripavail.com'}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <div>{item.label}</div>
                {item.subtitle && <div className="text-xs text-gray-500">{item.subtitle}</div>}
              </div>
            </Link>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-4 rounded-lg bg-purple-50 p-4">
            <p className="text-xs font-semibold text-gray-700">Pending Approvals</p>
            <p className="mt-1 text-2xl font-bold text-purple-600">5</p>
          </div>

          {/* Version */}
          <div className="text-center text-xs text-gray-400">Version 1.0.0 · Made with ❤️</div>
        </div>
      </div>
    </aside>
  );
}
