'use client';

import { useHostOnboardingStore, ONBOARDING_STEPS } from '@/store/useHostOnboardingStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';

export function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const { currentStep, completedSteps, setStep } = useHostOnboardingStore();

    const totalSteps = ONBOARDING_STEPS.length;
    // Exclude Overview (0) and Success (last) from progress calculation if you prefer,
    // making it effectively 7 steps for the user perception.
    // For simplicity, let's map: 
    // 0 (Overview) -> 0%
    // 1 (Welcome) -> 14% ...
    const progressPercentage = (currentStep / (totalSteps - 1)) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Header - Only show if not on Overview or Success for cleaner look? 
          Or always show? Let's show always but simpler on overview. */}
            {currentStep > 0 && currentStep < totalSteps - 1 && (
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
                    <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-sm font-semibold text-gray-900">
                                Host Onboarding
                            </div>
                            <div className="hidden sm:flex items-center gap-1">
                                {ONBOARDING_STEPS.slice(1, -1).map((step, idx) => {
                                    // Actual step index is idx + 1
                                    const stepIndex = idx + 1;
                                    const isActive = currentStep === stepIndex;
                                    const isCompleted = completedSteps.includes(step.id) || currentStep > stepIndex;

                                    return (
                                        <div key={step.id} className="flex items-center">
                                            <div
                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${isActive ? 'bg-rose-600 scale-125' :
                                                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                                    }`}
                                            />
                                            {idx < ONBOARDING_STEPS.length - 3 && ( // Connector line
                                                <div className={`w-4 h-0.5 mx-1 ${isCompleted ? 'bg-green-200' : 'bg-gray-100'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="text-xs font-medium text-gray-500">
                            Step {currentStep} of {totalSteps - 2}
                        </div>
                    </div>

                    {/* Progress Line */}
                    <div className="h-0.5 w-full bg-gray-100">
                        <motion.div
                            className="h-full bg-rose-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, progressPercentage)}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </header>
            )}

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-3xl mx-auto p-4 sm:p-6 md:py-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
