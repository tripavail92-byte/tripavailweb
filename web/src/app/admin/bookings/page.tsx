'use client';

import { EmptyState } from '@/components/ui';

export default function AdminBookingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Booking Management</h1>
      <EmptyState 
        title="Booking Management"
        description="Booking management features coming in Week 10. This will include booking monitoring, intervention, and refund management."
        icon="📅"
      />
    </div>
  );
}
