'use client';

import { OnboardingLayout } from '@/components/host-onboarding/OnboardingLayout';
import { HostOnboardingWizard } from '@/components/host-onboarding/HostOnboardingWizard';
import { useEffect } from 'react';
import { useHostOnboardingStore } from '@/store/useHostOnboardingStore';

export default function HostOnboardingPage() {
    // Optional: Reset on mount if you don't want persistence?
    // For onboarding, persistence is usually good.
    // const { resetOnboarding } = useHostOnboardingStore();
    // useEffect(() => { resetOnboarding() }, []);

    return (
        <OnboardingLayout>
            <HostOnboardingWizard />
        </OnboardingLayout>
    );
}
