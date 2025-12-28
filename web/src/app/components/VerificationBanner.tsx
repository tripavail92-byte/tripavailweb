'use client';

import type { ProviderProfile } from '@/lib/api-client';

export function VerificationBanner({ profile }: { profile: ProviderProfile }) {
  if (profile.verificationStatus === 'APPROVED') return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="font-semibold">Verification needed</div>
      <p className="mt-1">
        Status: {profile.verificationStatus}. You can build drafts, but publishing is blocked until approval.
      </p>
    </div>
  );
}
