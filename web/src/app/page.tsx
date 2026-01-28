'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ModernTrendingSlider } from '@/components/home/ModernTrendingSlider';
import { FeaturedHotelsSection } from '@/components/home/FeaturedHotelsSection';
import { FeaturedToursSection } from '@/components/home/FeaturedToursSection';

export default function TravelerHome() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Note: Previous logic redirected logged-in users to dashboard.
  // The Bible homepage seems to be accessible even if logged in (as a "Browse" mode).
  // However, to respect original logic, I'll keep the redirect if that's desired, 
  // BUT usually a homepage should be viewable. 
  // Code interaction history showed: "Redirect logged-in users to dashboard".
  // I will comment this out for now to let you see the pretty homepage, 
  // or you can uncomment it if you strictly want to force dashboard.
  /*
  useEffect(() => {
    if (!loading && user) {
      router.push('/traveler/dashboard');
    }
  }, [user, loading, router]);
  */

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* 1. Hero with Modern Slider */}
        <ModernTrendingSlider />

        {/* 2. Featured Hotels */}
        <FeaturedHotelsSection />

        {/* 3. Featured Tours */}
        <FeaturedToursSection />

        {/* 4. Why Us / Trust Signals (Simplified) */}
        <section className="py-10 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Verified Listings', icon: '✅' },
              { label: 'Secure Payment', icon: '🔒' },
              { label: '24/7 Support', icon: '💬' },
              { label: 'Best Price', icon: '🏷️' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-gray-400 grayscale hover:grayscale-0 transition duration-300 cursor-default">
                <span className="text-3xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
