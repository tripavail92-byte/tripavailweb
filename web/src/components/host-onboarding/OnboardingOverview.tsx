'use client';

import { useHostOnboardingStore } from '@/store/useHostOnboardingStore';
import { motion } from 'framer-motion';
import { Building, MapPin, List, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function OnboardingOverview() {
    const { setStep, initializeOnboarding } = useHostOnboardingStore();
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const steps = [
        { icon: Building, title: 'Hotel Details', desc: 'Name, description, contact info' },
        { icon: MapPin, title: 'Location', desc: 'Address and map coordinates' },
        { icon: List, title: 'Amenities & Rules', desc: 'Facilities and policies' },
        { icon: CheckCircle, title: 'Review & Publish', desc: 'Final check before live' },
    ];

    const handleGetStarted = async () => {
        try {
            setIsStarting(true);
            setError(null);

            // Call backend API to start onboarding and create provider profile
            await initializeOnboarding();

            // Move to next step (Hotel Info)
            setStep(1);
        } catch (err: any) {
            console.error('Failed to start onboarding:', err);
            setError(err?.message || 'Failed to connect to server. Please ensure backend is running.');
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-10">
            <div className="text-center space-y-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center justify-center p-3 bg-rose-100 text-rose-600 rounded-2xl mb-4"
                >
                    <Building size={32} />
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900">Welcome to Hotel Onboarding</h1>
                <p className="text-lg text-gray-600 max-w-md mx-auto">
                    Complete the following steps to become a TripAvail host and start receiving bookings.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex items-center p-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 mr-4">
                            <step.icon size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{step.title}</h3>
                            <p className="text-sm text-gray-500">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    ⚠️ {error}
                </div>
            )}

            <div className="flex justify-center">
                <motion.button
                    onClick={handleGetStarted}
                    disabled={isStarting}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-rose-600 hover:to-pink-600 transition shadow-lg shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={!isStarting ? { scale: 1.02 } : {}}
                    whileTap={!isStarting ? { scale: 0.98 } : {}}
                >
                    {isStarting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Starting...
                        </>
                    ) : (
                        <>
                            Start Onboarding
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </motion.button>
            </div>

            <p className="text-center text-sm text-gray-500">
                💡 Your progress will be saved automatically
            </p>
        </div>
    );
}
