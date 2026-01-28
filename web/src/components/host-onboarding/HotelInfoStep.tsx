'use client';

import { useHostOnboardingStore } from '@/store/useHostOnboardingStore';
import { motion } from 'framer-motion';

export function HotelInfoStep() {
    const { data, updateData } = useHostOnboardingStore();

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Tell us about your property</h2>
                <p className="text-gray-500">Start with the basics so guests can find you.</p>
            </div>

            <div className="space-y-4">
                {/* Hotel Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                    <input
                        type="text"
                        value={data.hotelName}
                        onChange={(e) => updateData({ hotelName: e.target.value })}
                        placeholder="e.g. Hunza View Heights"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                    />
                </div>

                {/* Property Type & Star Rating */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                        <select
                            value={data.propertyType || 'HOTEL'}
                            onChange={(e) => updateData({ propertyType: e.target.value as any })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        >
                            <option value="HOTEL">Hotel</option>
                            <option value="MOTEL">Motel</option>
                            <option value="RESORT">Resort</option>
                            <option value="INN">Inn</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                        <select
                            value={data.starRating || 0}
                            onChange={(e) => updateData({ starRating: Number(e.target.value) })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        >
                            <option value="0">Unrated</option>
                            <option value="1">1 Star</option>
                            <option value="2">2 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="5">5 Stars</option>
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={data.description}
                        onChange={(e) => updateData({ description: e.target.value })}
                        rows={4}
                        placeholder="Describe what makes your property unique..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition resize-none"
                    />
                </div>

                {/* Contact info split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="tel"
                            value={data.phone}
                            onChange={(e) => updateData({ phone: e.target.value })}
                            placeholder="+92 300 1234567"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => updateData({ email: e.target.value })}
                            placeholder="reservations@hotel.com"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
