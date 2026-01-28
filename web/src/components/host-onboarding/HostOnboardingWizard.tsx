'use client';

import { useHostOnboardingStore, ONBOARDING_STEPS } from '@/store/useHostOnboardingStore';
import { OnboardingOverview } from './OnboardingOverview';
import { HotelInfoStep } from './HotelInfoStep';
import { LocationStep } from './LocationStep';
import { AmenitiesStep } from './AmenitiesStep';
import { RulesStep } from './RulesStep';
import { RoomDetailsStep } from './RoomDetailsStep';
import { ReviewStep } from './ReviewStep';
import { SuccessStep } from './SuccessStep';
import { ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function HostOnboardingWizard() {
    const {
        currentStep,
        setStep,
        markStepComplete,
        providerId,
        initializeOnboarding,
        saveHotelInfo,
        saveLocation,
        saveAmenities,
        saveRules,
        saveRooms,
        saveReview,
        submitForReview,
        isSaving,
        error,
    } = useHostOnboardingStore();

    const totalSteps = ONBOARDING_STEPS.length;

    // NOTE: Removed auto-initialization on mount
    // Provider ID is now created when user clicks "Start Onboarding" in Step 1

    const handleNext = async () => {
        try {
            // Save current step data to backend based on which step we're on
            if (currentStep === 2 || currentStep === 1) {
                // Hotel Info Step
                await saveHotelInfo();
            } else if (currentStep === 3) {
                // Location Step
                await saveLocation();
            } else if (currentStep === 4) {
                // Amenities Step
                await saveAmenities();
            } else if (currentStep === 5) {
                // Rules Step
                await saveRules();
            } else if (currentStep === 6) {
                // Rooms Step
                await saveRooms();
            }

            // Mark current step as complete
            const currentStepId = ONBOARDING_STEPS[currentStep].id;
            markStepComplete(currentStepId);

            // Move to next step
            if (currentStep < totalSteps - 1) {
                setStep(currentStep + 1);
            }
        } catch (err) {
            console.error('Failed to save step:', err);
            // Error is already set in store state
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            // Save review step data
            await saveReview();
            // Submit for review
            await submitForReview();
            // Success step is automatically set in submitForReview
        } catch (err) {
            console.error('Failed to submit:', err);
        }
    };

    // Render current step component
    const renderStep = () => {
        switch (currentStep) {
            case 0: return <OnboardingOverview />;
            case 1: return <HotelInfoStep />;
            case 2: return <HotelInfoStep />;
            case 3: return <LocationStep />;
            case 4: return <AmenitiesStep />;
            case 5: return <RulesStep />;
            case 6: return <RoomDetailsStep />;
            case 7: return <ReviewStep />;
            case 8: return <SuccessStep />;
            default: return <OnboardingOverview />;
        }
    };

    // Hide nav on Overview (0) and Success (8)
    const showNav = currentStep > 0 && currentStep < 8;

    return (
        <>
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {renderStep()}

            {showNav && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between"
                >
                    <button
                        onClick={handleBack}
                        disabled={isSaving}
                        className="flex items-center gap-2 text-gray-500 font-medium hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>

                    {currentStep === 7 ? ( // Review Step
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-rose-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving && <Loader2 size={18} className="animate-spin" />}
                            Submit Listing
                            {!isSaving && <ChevronRight size={18} />}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving && <Loader2 size={18} className="animate-spin" />}
                            Continue
                            {!isSaving && <ChevronRight size={18} />}
                        </button>
                    )}
                </motion.div>
            )}
        </>
    );
}
