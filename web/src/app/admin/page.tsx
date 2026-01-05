'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  revenue: number;
  openDisputes: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    revenue: 0,
    openDisputes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:4100/v1/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setError(null);
        } else if (response.status === 404) {
          // Endpoint not available yet, use stub data
          setStats({
            totalUsers: 0,
            totalProviders: 0,
            totalBookings: 0,
            revenue: 0,
            openDisputes: 0,
          });
          setError('Dashboard endpoint in development');
        } else {
          setError(`Failed to fetch stats: ${response.statusText}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Overview</h1>
        {error && (
          <div className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          color="bg-blue-50"
          icon="👥"
        />
        <StatCard
          label="Total Providers"
          value={stats.totalProviders}
          color="bg-green-50"
          icon="🏨"
        />
        <StatCard
          label="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          color="bg-purple-50"
          icon="📋"
        />
        <StatCard
          label="Revenue"
          value={`$${(stats.revenue / 1000).toFixed(0)}k`}
          color="bg-emerald-50"
          icon="💰"
        />
        <StatCard
          label="Open Disputes"
          value={stats.openDisputes}
          color="bg-red-50"
          icon="⚠️"
        />
      </div>

      {/* Sections */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard
          title="Recent Actions"
          items={[
            'User john@example.com suspended',
            'Provider hotel-123 approved KYC',
            'Booking #5678 refunded $150',
          ]}
        />
        <SectionCard
          title="System Health"
          items={['Database: ✅ Connected', 'Redis: ✅ Connected', 'API: ✅ Healthy']}
        />
      </div>

      {/* Placeholder sections */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Booking Trends (Last 7 days)</h3>
          <p className="mt-2 text-sm text-neutral-600">[Chart placeholder]</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="font-semibold">Revenue by Provider</h3>
          <p className="mt-2 text-sm text-neutral-600">[Chart placeholder]</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: string;
}) {
  return (
    <div className={`rounded-lg ${color} p-4 shadow-sm`}>
      <div className="text-2xl">{icon}</div>
      <p className="mt-2 text-sm text-neutral-600">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function SectionCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <span className="mt-1 text-neutral-400">•</span>
            <span className="text-neutral-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
