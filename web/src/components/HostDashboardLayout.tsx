'use client';

import { HostSidebar } from '@/components/HostSidebar';

export function HostDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-gray-50">
      <HostSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
