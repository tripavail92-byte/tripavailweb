'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

export default function TravelerDashboard() {
  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-5xl">
          <h1 className="text-3xl font-semibold text-gray-900">Welcome back!</h1>
          <p className="mt-2 text-gray-600">Here's what's happening with your trips</p>

          {/* Placeholder content */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="mt-4 h-3 w-40 rounded bg-gray-100" />
                <div className="mt-2 h-3 w-32 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
