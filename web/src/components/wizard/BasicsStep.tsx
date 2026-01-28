'use client';

import { usePackageCreationStore } from '@/store/usePackageCreationStore';

export function BasicsStep() {
    const { formData, updateFormData } = usePackageCreationStore();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Package Basics</h2>
                <p className="text-gray-500">Establish your package identity with a clear name and description.</p>
            </div>

            <div className="space-y-6">
                {/* Package Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateFormData({ title: e.target.value })}
                        placeholder="e.g., Romantic Paris Getaway"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition shadow-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500 flex justify-between">
                        <span>Be descriptive and catchy</span>
                        <span>{formData.title.length}/80</span>
                    </p>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => updateFormData({ description: e.target.value })}
                        rows={5}
                        placeholder="Describe what makes this package special..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition shadow-sm resize-none"
                    />
                </div>

                {/* Duration */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min={1}
                            max={30}
                            value={formData.duration}
                            onChange={(e) => updateFormData({ duration: Number(e.target.value) })}
                            className="flex-1 accent-rose-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="w-20 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-center font-semibold text-gray-900">
                            {formData.duration} days
                        </div>
                    </div>
                </div>

                {/* Price Per Person */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Person</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3.5 text-gray-400">$</span>
                        <input
                            type="number"
                            value={formData.pricePerPerson}
                            onChange={(e) => updateFormData({ pricePerPerson: Number(e.target.value) })}
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition shadow-sm"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Base price per person for this package</p>
                </div>
            </div>
        </div>
    );
}
