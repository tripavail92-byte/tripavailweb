'use client';

import { usePackageCreationStore } from '@/store/usePackageCreationStore';
import { PackageTypeStep } from './PackageTypeStep';
import { BasicsStep } from './BasicsStep';

export function CreatePackageWizard() {
    const { currentStep } = usePackageCreationStore();

    switch (currentStep) {
        case 1:
            return <PackageTypeStep />;
        case 2:
            return <BasicsStep />;
        case 3:
            return <div className="text-center py-20 text-gray-500">Step 3: Media Upload (Coming Soon)</div>;
        case 4:
            return <div className="text-center py-20 text-gray-500">Step 4: Highlights (Coming Soon)</div>;
        case 5:
            return <div className="text-center py-20 text-gray-500">Step 5: Inclusions (Coming Soon)</div>;
        case 6:
            return <div className="text-center py-20 text-gray-500">Step 6: Exclusions (Coming Soon)</div>;
        case 7:
            return <div className="text-center py-20 text-gray-500">Step 7: Pricing (Coming Soon)</div>;
        case 8:
            return <div className="text-center py-20 text-gray-500">Step 8: Calendar (Coming Soon)</div>;
        case 9:
            return <div className="text-center py-20 text-gray-500">Step 9: Policy (Coming Soon)</div>;
        case 10:
            return <div className="text-center py-20 text-gray-500">Step 10: Confirmation (Coming Soon)</div>;
        default:
            return <div>Unknown Step</div>;
    }
}
