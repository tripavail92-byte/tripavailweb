'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import { AdminDashboardLayout } from '@/components/AdminDashboardLayout';

interface Provider {
  id: string;
  name: string;
  email: string;
  type: 'HOTEL_MANAGER' | 'TOUR_OPERATOR';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  documents: number;
}

interface Dispute {
  id: string;
  bookingId: string;
  guestName: string;
  provider: string;
  title: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <AdminDashboardLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-purple-600" />
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </AdminDashboardLayout>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  // Mock data for admin
  const stats = [
    { label: 'Total Users', value: 342, icon: '👥', color: 'purple' },
    { label: 'Pending Approvals', value: 5, icon: '✅', color: 'yellow' },
    { label: 'Active Disputes', value: 3, icon: '⚠️', color: 'red' },
    { label: 'Monthly Revenue', value: 'PKR 2.3M', icon: '💰', color: 'green' },
  ];

  const pendingProviders: Provider[] = [
    {
      id: 'P001',
      name: 'Serena Hotels Pakistan',
      email: 'serenah@serenhotels.com',
      type: 'HOTEL_MANAGER',
      status: 'SUBMITTED',
      submittedAt: '2026-01-05',
      documents: 4,
    },
    {
      id: 'P002',
      name: 'Mountain Adventures Co.',
      email: 'info@mountainadventures.pk',
      type: 'TOUR_OPERATOR',
      status: 'UNDER_REVIEW',
      submittedAt: '2026-01-03',
      documents: 6,
    },
    {
      id: 'P003',
      name: 'Pearl Hotels Skardu',
      email: 'skardu@pearlhotels.pk',
      type: 'HOTEL_MANAGER',
      status: 'IN_PROGRESS',
      submittedAt: '2026-01-01',
      documents: 2,
    },
    {
      id: 'P004',
      name: 'Northern Trek Expeditions',
      email: 'bookings@northerntrek.pk',
      type: 'TOUR_OPERATOR',
      status: 'SUBMITTED',
      submittedAt: '2026-01-06',
      documents: 5,
    },
    {
      id: 'P005',
      name: 'Hunza Valley Resorts',
      email: 'info@hunzavalley.pk',
      type: 'HOTEL_MANAGER',
      status: 'UNDER_REVIEW',
      submittedAt: '2026-01-04',
      documents: 3,
    },
  ];

  const activeDisputes: Dispute[] = [
    {
      id: 'D001',
      bookingId: 'BK001',
      guestName: 'Ahmad Ali',
      provider: 'Serena Hotels',
      title: 'Room not as advertised',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      createdAt: '2026-01-05',
    },
    {
      id: 'D002',
      bookingId: 'BK002',
      guestName: 'Fatima Khan',
      provider: 'Mountain Adventures',
      title: 'Guide did not show up',
      status: 'OPEN',
      priority: 'CRITICAL',
      createdAt: '2026-01-06',
    },
    {
      id: 'D003',
      bookingId: 'BK003',
      guestName: 'Hassan Ahmed',
      provider: 'Pearl Hotels',
      title: 'Refund request pending',
      status: 'IN_REVIEW',
      priority: 'MEDIUM',
      createdAt: '2026-01-04',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDisputePriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700';
      case 'HIGH':
        return 'bg-orange-100 text-orange-700';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700';
      case 'LOW':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="bg-gray-50 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard 📊</h1>
          <p className="mt-2 text-gray-600">Platform overview and management tools</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <span className="text-3xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Pending Verification Queue */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Verification Queue</h2>
                  <Link
                    href="/admin/verification"
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {pendingProviders.map((provider) => (
                  <div key={provider.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                          <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold">
                            {provider.type === 'HOTEL_MANAGER' ? '🏨' : '🚌'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{provider.email}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                          <span>📋 {provider.documents} documents</span>
                          <span>📅 Submitted {provider.submittedAt}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(provider.status)}`}
                        >
                          {provider.status.replace(/_/g, ' ')}
                        </span>
                        <div className="mt-2">
                          <button className="rounded-md bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700">
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Disputes */}
          <div>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Active Disputes</h2>
                  <Link
                    href="/admin/disputes"
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    View all →
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {activeDisputes.map((dispute) => (
                  <div key={dispute.id} className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{dispute.title}</h4>
                        <p className="text-xs text-gray-600">
                          {dispute.guestName} vs {dispute.provider}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${getDisputePriorityColor(dispute.priority)}`}
                      >
                        {dispute.priority}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">📅 {dispute.createdAt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardLayout>
  );
}
