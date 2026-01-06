'use client';

import { ProviderProfile } from '@/lib/api-client';

export interface PartnerStatusBannerProps {
  profile: ProviderProfile;
}

export function PartnerStatusBanner({ profile }: PartnerStatusBannerProps) {
  const statusConfig = {
    'NOT_STARTED': {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: '📋',
      label: 'Not Started',
      color: 'text-gray-700',
    },
    'IN_PROGRESS': {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: '⏳',
      label: 'In Progress',
      color: 'text-blue-700',
    },
    'SUBMITTED': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '📤',
      label: 'Submitted',
      color: 'text-yellow-700',
    },
    'UNDER_REVIEW': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: '👀',
      label: 'Under Review',
      color: 'text-yellow-700',
    },
    'APPROVED': {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: '✅',
      label: 'Approved',
      color: 'text-green-700',
    },
    'REJECTED': {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: '❌',
      label: 'Rejected',
      color: 'text-red-700',
    },
    'SUSPENDED': {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: '⚠️',
      label: 'Suspended',
      color: 'text-orange-700',
    },
  };

  const config = statusConfig[profile.verificationStatus] || statusConfig['IN_PROGRESS'];

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <h3 className={`text-sm font-semibold ${config.color}`}>{config.label}</h3>
              <p className="text-xs text-gray-600">
                {profile.providerType === 'HOTEL_MANAGER' ? '🏨 Hotel Manager' : '🎒 Tour Operator'}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-xs text-gray-700">
            {profile.submittedAt && (
              <div>
                <span className="font-medium">Submitted:</span>{' '}
                {formatDate(profile.submittedAt)}
              </div>
            )}
            {profile.reviewedAt && (
              <div>
                <span className="font-medium">Reviewed:</span>{' '}
                {formatDate(profile.reviewedAt)}
              </div>
            )}
            {profile.rejectionReason && (
              <div className="mt-2 rounded bg-red-100 p-2 text-red-800">
                <span className="font-medium">Reason:</span> {profile.rejectionReason}
              </div>
            )}
          </div>
        </div>

        {profile.verificationStatus === 'APPROVED' && (
          <div className="rounded-full bg-green-200 px-3 py-1 text-xs font-semibold text-green-800">
            Ready to Publish
          </div>
        )}
        {profile.verificationStatus === 'REJECTED' && (
          <div className="rounded-full bg-red-200 px-3 py-1 text-xs font-semibold text-red-800">
            Can Resubmit
          </div>
        )}
        {profile.verificationStatus === 'UNDER_REVIEW' && (
          <div className="rounded-full bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800">
            Pending Admin
          </div>
        )}
      </div>
    </div>
  );
}
