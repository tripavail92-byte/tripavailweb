'use client';

import { DashboardSidebar } from '@/components/DashboardSidebar';

export function HostDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
