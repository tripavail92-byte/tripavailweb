'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export function SuccessStep() {
    useEffect(() => {
        // Fire confetti on mount
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }, []);

    return (
        <div className="text-center py-10 space-y-6">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto"
            >
                <CheckCircle size={40} strokeWidth={3} />
            </motion.div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Submission Successful!</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    Your property has been sent for review. You can now manage your listing from the dashboard.
                </p>
            </div>

            <div className="pt-8">
                <Link
                    href="/host/dashboard"
                    className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-900 transition"
                >
                    Go to Dashboard
                    <ArrowRight size={18} />
                </Link>
            </div>
        </div>
    );
}
