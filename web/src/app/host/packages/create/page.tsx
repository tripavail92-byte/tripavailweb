'use client';

import { WizardLayout } from '@/components/wizard/WizardLayout';
import { CreatePackageWizard } from '@/components/wizard/CreatePackageWizard';
import { useEffect } from 'react';
import { usePackageCreationStore } from '@/store/usePackageCreationStore';

export default function CreatePackagePage() {
    const { resetWizard } = usePackageCreationStore();

    // Reset wizard on mount to ensure fresh state
    useEffect(() => {
        resetWizard();
    }, []);

    return (
        <WizardLayout>
            <CreatePackageWizard />
        </WizardLayout>
    );
}
