'use client';

import { motion } from 'framer-motion';
import { Hotel, Compass } from 'lucide-react';
import Link from 'next/link';

export default function BecomePartnerPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex items-center justify-center p-6">
            <div className="max-w-5xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-bold text-gray-900 mb-4"
                    >
                        Become a Partner
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-600"
                    >
                        Choose how you want to grow your business with TripAvail
                    </motion.p>
                </div>

                {/* Partner Type Cards */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Hotel Manager Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="group"
                    >
                        <Link href="/host/onboarding">
                            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 h-full hover:shadow-2xl hover:border-rose-200 transition-all cursor-pointer">
                                {/* Icon */}
                                <div className="w-20 h-20 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Hotel size={40} className="text-white" />
                                </div>

                                {/* Title */}
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                    Hotel Manager
                                </h2>

                                {/* Description */}
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    List your hotel, resort, or accommodation. Create packages, manage bookings, and reach thousands of travelers.
                                </p>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-2">
                                        <span className="text-rose-500 mt-1">✓</span>
                                        <span className="text-sm text-gray-700">Property & room management</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-rose-500 mt-1">✓</span>
                                        <span className="text-sm text-gray-700">Custom package creation</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-rose-500 mt-1">✓</span>
                                        <span className="text-sm text-gray-700">Real-time booking dashboard</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-rose-500 mt-1">✓</span>
                                        <span className="text-sm text-gray-700">Analytics & earnings tracking</span>
                                    </li>
                                </ul>

                                {/* CTA */}
                                <div className="flex items-center justify-between">
                                    <span className="text-rose-600 font-semibold group-hover:underline">
                                        Get Started →
                                    </span>
                                    <span className="text-xs text-gray-400">5-10 min setup</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Tour Operator Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="group"
                    >
                        <Link href="/operator/onboarding">
                            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 h-full hover:shadow-2xl hover:border-emerald-200 transition-all cursor-pointer">
                                {/* Icon */}
                                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Compass size={40} className="text-white" />
                                </div>

                                {/* Title */}
                                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                    Tour Operator
                                </h2>

                                {/* Description */}
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    Offer tours, experiences, and adventures. Manage itineraries, transportation, and create unforgettable trips.
                                </p>

                                {/* Features */}
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 mt-1">✓</span>
                                        <span className="text-sm text-gray-700">Tour & itinerary builder</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 mt-1">✓</span>
                                        <span className="text-sm text-gray-700">Fleet & guide management</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 mt-1">✓</span>
                                        <span className="text-sm text-gray-700">Booking & scheduling tools</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 mt-1">✓</span>
                                        <span className="text-sm text-gray-700">Performance tracking</span>
                                    </li>
                                </ul>

                                {/* CTA */}
                                <div className="flex items-center justify-between">
                                    <span className="text-emerald-600 font-semibold group-hover:underline">
                                        Get Started →
                                    </span>
                                    <span className="text-xs text-gray-400">5-10 min setup</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-12"
                >
                    <p className="text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-rose-600 hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
