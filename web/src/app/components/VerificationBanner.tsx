'use client';

import type { ProviderProfile } from '@/lib/api-client';

export function VerificationBanner({ profile }: { profile: ProviderProfile }) {
  if (profile.verificationStatus === 'APPROVED') return null;

  const status = profile.verificationStatus;
  const rejection = profile.rejectionReason;
  const messageByStatus: Record<string, string> = {
    UNDER_REVIEW: 'We are reviewing your submission. You can keep editing drafts; publishing waits for approval.',
    SUBMITTED: 'Submission received. We will review and notify you.',
    REJECTED: rejection
      ? `Submission was rejected: ${rejection}. Update your details and resubmit.`
      : 'Submission was rejected. Update your details and resubmit.',
  };

  const message = messageByStatus[status] || 'You can build drafts, but publishing is blocked until approval.';

  return (
    <div className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
      <div className="font-semibold">Verification needed</div>
      <p className="mt-1">Status: {status}</p>
      <p className="mt-1">{message}</p>
    </div>
  );
}
