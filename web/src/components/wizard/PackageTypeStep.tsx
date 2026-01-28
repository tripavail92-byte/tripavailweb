'use client';

import { usePackageCreationStore } from '@/store/usePackageCreationStore';
import { motion } from 'framer-motion';
import { Heart, Briefcase, Users, Mountain, Utensils, Crown, Calendar, Building2 } from 'lucide-react';

const PACKAGE_TYPES = [
    {
        id: 'weekend-getaway',
        name: 'Weekend Getaway',
        description: 'Perfect for 2-3 day short trips',
        icon: Calendar,
        color: 'bg-emerald-50 text-emerald-600',
        border: 'border-emerald-200',
    },
    {
        id: 'romantic-escape',
        name: 'Romantic Escape',
        description: 'Intimate packages for couples',
        icon: Heart,
        color: 'bg-pink-50 text-pink-600',
        border: 'border-pink-200',
    },
    {
        id: 'family-adventure',
        name: 'Family Adventure',
        description: 'Fun-filled packages for families',
        icon: Users,
        color: 'bg-blue-50 text-blue-600',
        border: 'border-blue-200',
    },
    {
        id: 'business-elite',
        name: 'Business Elite',
        description: 'Corporate rates and amenities',
        icon: Briefcase,
        color: 'bg-slate-50 text-slate-600',
        border: 'border-slate-200',
    },
    {
        id: 'adventure-package',
        name: 'Adventure',
        description: 'Outdoor experiences and thrills',
        icon: Mountain,
        color: 'bg-orange-50 text-orange-600',
        border: 'border-orange-200',
    },
    {
        id: 'luxury-experience',
        name: 'Luxury Experience',
        description: 'Ultra-premium VIP service',
        icon: Crown,
        color: 'bg-amber-50 text-amber-600',
        border: 'border-amber-200',
    },
];

export function PackageTypeStep() {
    const { formData, updateFormData, nextStep } = usePackageCreationStore();

    const handleSelect = (typeId: string) => {
        updateFormData({
            packageType: typeId,
            templateId: typeId, // Use same ID as template ID
        });
        // Optional: auto-advance
        // nextStep(); 
    };

    return (
        <div>
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Package Type</h1>
                <p className="text-gray-500">Select the type of package that best represents your offering.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PACKAGE_TYPES.map((type) => {
                    const isSelected = formData.packageType === type.id;
                    return (
                        <motion.div
                            key={type.id}
                            whileHover={{ y: -4 }}
                            onClick={() => handleSelect(type.id)}
                            className={`
                    relative cursor-pointer rounded-2xl border-2 p-6 transition-all
                    ${isSelected
                                    ? `border-rose-500 bg-rose-50 ring-4 ring-rose-100`
                                    : `border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg`
                                }
                `}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${type.color}`}>
                                <type.icon size={24} />
                            </div>
                            <h3 className={`text-lg font-bold mb-1 ${isSelected ? 'text-rose-900' : 'text-gray-900'}`}>
                                {type.name}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {type.description}
                            </p>

                            {isSelected && (
                                <div className="absolute top-4 right-4 text-rose-500">
                                    <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-white text-xs">
                                        ✓
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Hotel/Listing ID Input */}
            <div className="mt-10 max-w-2xl mx-auto">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <Building2 className="text-blue-600 mt-1" size={24} />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Your Property</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Enter the Listing ID of the hotel property this package will be associated with.
                            </p>
                            <input
                                type="text"
                                value={formData.listingId || ''}
                                onChange={(e) => updateFormData({ listingId: e.target.value })}
                                placeholder="e.g., hot_abcd1234xyz"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                💡 <strong>Tip:</strong> You can find your Listing ID in your hotel dashboard under Property Settings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
