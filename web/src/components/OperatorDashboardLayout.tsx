'use client';

import { DashboardSidebar } from '@/components/DashboardSidebar';
import { ReactNode } from 'react';

export function OperatorDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
