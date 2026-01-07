'use client';

import { OperatorSidebar } from '@/components/OperatorSidebar';

export function OperatorDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex bg-gray-50">
      <OperatorSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
