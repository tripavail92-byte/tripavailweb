'use client';

import { usePackageCreationStore } from '@/store/usePackageCreationStore';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function WizardLayout({ children }: { children: React.ReactNode }) {
    const {
        currentStep,
        totalSteps,
        nextStep,
        prevStep,
        providerId,
        packageId,
        formData,
        setProviderId,
        updateFormData,
        createPackage,
        updateBasics,
        publishPackage,
        isSaving,
        error,
    } = usePackageCreationStore();

    const router = useRouter();
    const { user } = useAuth();

    // Initialize provider ID from user's profiles
    useEffect(() => {
        if (user?.profiles && !providerId) {
            const hotelManagerProfile = user.profiles.find(p => p.providerType === 'HOTEL_MANAGER');
            if (hotelManagerProfile) {
                setProviderId(hotelManagerProfile.id);
            }
        }
    }, [user, providerId, setProviderId]);

    const progressPercentage = (currentStep / totalSteps) * 100;

    const handleBack = () => {
        if (currentStep === 1) {
            router.back();
        } else {
            prevStep();
        }
    };

    const handleNext = async () => {
        try {
            // Save data based on current step
            if (currentStep === 2) {
                // Create package with basics on step 2
                await createPackage();
            } else if (currentStep > 2 && currentStep < totalSteps) {
                // Update basics for subsequent steps
                await updateBasics();
            } else if (currentStep === totalSteps) {
                // Publish on final step
                await publishPackage();
                return; // publishPackage handles navigation
            }

            // Proceed to next step if save succeeded
            nextStep();
        } catch (err) {
            console.error('Failed to save step:', err);
            // Error displayed via store.error
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={isSaving}
                        className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                    >
                        <ChevronLeft size={18} />
                        {currentStep === 1 ? 'Exit' : 'Back'}
                    </button>
                    <div className="text-sm font-semibold text-gray-900">
                        Step {currentStep} of {totalSteps}
                    </div>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>

                {/* Progress Bar */}
                <div className="h-1 bg-gray-100 w-full">
                    <motion.div
                        className="h-full bg-rose-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl mx-auto w-full p-6">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[600px]"
                >
                    {children}
                </motion.div>
            </main>

            {/* Persistent Footer */}
            <footer className="bg-white border-t border-gray-200 p-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button
                        onClick={handleBack}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition disabled:opacity-50"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={isSaving}
                        className="px-8 py-2.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
                    >
                        {isSaving && <Loader2 size={18} className="animate-spin" />}
                        {currentStep === totalSteps ? 'Publish Package' : 'Next Step'}
                        {!isSaving && <ChevronRight size={18} />}
                    </button>
                </div>
            </footer>
        </div>
    );
}

