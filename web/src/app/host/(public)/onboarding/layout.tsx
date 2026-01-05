'use client';

import { useAuth } from '@/hooks/useAuth';
import { DashboardSwitcher } from '@/app/components/DashboardSwitcher';
import { useRouter } from 'next/navigation';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="font-semibold">Host Onboarding</div>
          <div className="flex items-center gap-4">
            {loading && <span className="text-sm text-neutral-500">Loading...</span>}
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-600">👤 {user.email}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-50"
                >
                  Logout
                </button>
              </div>
            )}
            {!loading && !user && (
              <span className="text-sm text-red-600">Not logged in</span>
            )}
            <DashboardSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
