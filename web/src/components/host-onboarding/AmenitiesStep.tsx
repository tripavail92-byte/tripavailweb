'use client';

import { useHostOnboardingStore } from '@/store/useHostOnboardingStore';
import { Wifi, Car, Coffee, Utensils, Tv, Wind, Waves, Dumbbell } from 'lucide-react';

const AMENITIES_LIST = [
    { id: 'wifi', icon: Wifi, label: 'Free Wi-Fi' },
    { id: 'parking', icon: Car, label: 'Free Parking' },
    { id: 'breakfast', icon: Coffee, label: 'Breakfast' },
    { id: 'restaurant', icon: Utensils, label: 'Restaurant' },
    { id: 'ac', icon: Wind, label: 'Air Conditioning' },
    { id: 'tv', icon: Tv, label: 'Smart TV' },
    { id: 'pool', icon: Waves, label: 'Swimming Pool' },
    { id: 'gym', icon: Dumbbell, label: 'Fitness Center' },
];

export function AmenitiesStep() {
    const { data, updateData } = useHostOnboardingStore();

    const toggleAmenity = (id: string) => {
        const current = data.selectedAmenities || [];
        const updated = current.includes(id)
            ? current.filter(item => item !== id)
            : [...current, id];
        updateData({ selectedAmenities: updated });
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">What amenities do you offer?</h2>
                <p className="text-gray-500">Select all that apply to your property.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {AMENITIES_LIST.map((item) => {
                    const isSelected = data.selectedAmenities.includes(item.id);
                    return (
                        <button
                            key={item.id}
                            onClick={() => toggleAmenity(item.id)}
                            className={`
                     flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all
                     ${isSelected
                                    ? 'border-rose-500 bg-rose-50 text-rose-700'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                }
                  `}
                        >
                            <item.icon size={24} className="mb-2" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
