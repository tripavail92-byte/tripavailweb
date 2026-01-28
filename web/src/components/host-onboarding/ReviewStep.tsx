'use client';

import { useHostOnboardingStore } from '@/store/useHostOnboardingStore';

export function ReviewStep() {
    const { data, updateData } = useHostOnboardingStore();

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Review your listing</h2>
                <p className="text-gray-500">Check everything before submitting.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                {/* Hotel Info */}
                <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Property Details</h4>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-semibold text-gray-900">{data.hotelName || 'No Name'}</p>
                            <p className="text-sm text-gray-500">{data.hotelAddress || 'No Address'}</p>
                        </div>
                        {/* Could add Edit button here */}
                    </div>
                </div>

                {/* Amenities */}
                <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                        {data.selectedAmenities.length > 0 ? (
                            data.selectedAmenities.map(id => (
                                <span key={id} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-sm capitalize">
                                    {id}
                                </span>
                            ))
                        ) : <span className="text-sm text-gray-400 italic">No amenities selected</span>}
                    </div>
                </div>

                {/* Rooms */}
                <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Rooms</h4>
                    <div className="space-y-2">
                        {data.rooms.map(room => (
                            <div key={room.id} className="flex justify-between text-sm">
                                <span>{room.name}</span>
                                <span className="font-medium">${room.basePrice}/night</span>
                            </div>
                        ))}
                        {data.rooms.length === 0 && <span className="text-sm text-gray-400 italic">No rooms added</span>}
                    </div>
                </div>
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={data.acceptTerms}
                        onChange={(e) => updateData({ acceptTerms: e.target.checked })}
                        className="mt-1 w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        I accept the <a href="#" className="text-rose-600 hover:underline">Terms and Conditions</a> and understand that my listing will be reviewed before going live.
                    </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={data.marketingOptIn}
                        onChange={(e) => updateData({ marketingOptIn: e.target.checked })}
                        className="mt-1 w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        Send me tips, updates, and promotional offers via email
                    </span>
                </label>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700">
                By clicking "Submit Listing", you agree to our Host Terms and Conditions. Your listing will be reviewed by our team within 24 hours.
            </div>
        </div>
    );
}
