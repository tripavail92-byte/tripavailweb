'use client';

import { useHostOnboardingStore } from '@/store/useHostOnboardingStore';
import { MapPin } from 'lucide-react';

export function LocationStep() {
    const { data, updateData } = useHostOnboardingStore();

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Where is your property located?</h2>
                <p className="text-gray-500">Guests will use this to navigate to your location.</p>
            </div>

            <div className="space-y-4">
                {/* Street Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={data.streetAddress || ''}
                            onChange={(e) => updateData({ streetAddress: e.target.value })}
                            placeholder="123 Main Street"
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* City & State/Province */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                            type="text"
                            value={data.city || ''}
                            onChange={(e) => updateData({ city: e.target.value })}
                            placeholder="Hunza"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                        <input
                            type="text"
                            value={data.stateProvince || ''}
                            onChange={(e) => updateData({ stateProvince: e.target.value })}
                            placeholder="Gilgit-Baltistan"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* Country & Postal Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                            type="text"
                            value={data.country || ''}
                            onChange={(e) => updateData({ country: e.target.value })}
                            placeholder="Pakistan"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <input
                            type="text"
                            value={data.postalCode || ''}
                            onChange={(e) => updateData({ postalCode: e.target.value })}
                            placeholder="15700"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* Map Placeholder */}
                <div className="aspect-video bg-gray-100 rounded-xl border border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group">
                    <div className="text-center p-6">
                        <MapPin className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-500">Map Integration Coming Soon</p>
                        <p className="text-xs text-gray-400">Coordinates will be geocoded automatically</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
