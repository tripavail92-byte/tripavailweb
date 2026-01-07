'use client';

import { AdminSidebar } from '@/components/AdminSidebar';

export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
