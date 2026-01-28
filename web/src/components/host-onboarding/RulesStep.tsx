'use client';

import { useHostOnboardingStore } from '@/store/useHostOnboardingStore';

export function RulesStep() {
    const { data, updateData } = useHostOnboardingStore();

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">House Rules & Policies</h2>
                <p className="text-gray-500">Set expectations for your guests.</p>
            </div>

            <div className="space-y-6">
                {/* Check-in / Check-out */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                        <input
                            type="time"
                            value={data.checkIn}
                            onChange={(e) => updateData({ checkIn: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
                        <input
                            type="time"
                            value={data.checkOut}
                            onChange={(e) => updateData({ checkOut: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        />
                    </div>
                </div>

                {/* Cancellation & Payment Policies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy</label>
                        <select
                            value={data.cancellationPolicy || 'FLEXIBLE'}
                            onChange={(e) => updateData({ cancellationPolicy: e.target.value as any })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        >
                            <option value="FLEXIBLE">Flexible (Free cancellation up to 24h before)</option>
                            <option value="MODERATE">Moderate (Free cancellation up to 5 days before)</option>
                            <option value="STRICT">Strict (No free cancellation)</option>
                            <option value="NON_REFUNDABLE">Non-refundable</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                        <select
                            value={data.paymentTerms || 'FULL_AT_BOOKING'}
                            onChange={(e) => updateData({ paymentTerms: e.target.value as any })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                        >
                            <option value="FULL_AT_BOOKING">Full payment at booking</option>
                            <option value="DEPOSIT_PLUS_BALANCE">Deposit now, balance later</option>
                            <option value="PAY_AT_ARRIVAL">Pay at arrival</option>
                        </select>
                    </div>
                </div>

                {/* House Rules */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">House Rules</label>
                    <textarea
                        value={data.houseRules || ''}
                        onChange={(e) => updateData({ houseRules: e.target.value })}
                        rows={3}
                        placeholder="e.g., No smoking, No parties, Quiet hours after 10pm..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition resize-none"
                    />
                </div>

                {/* Age Restrictions */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age Restrictions</label>
                    <input
                        type="text"
                        value={data.ageRestrictions || ''}
                        onChange={(e) => updateData({ ageRestrictions: e.target.value })}
                        placeholder="e.g., Minimum age 18, children under 12 stay free..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                    />
                </div>

                {/* Pet Policy */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h4 className="font-medium text-gray-900">Pet Policy</h4>
                            <p className="text-sm text-gray-500">Do you allow pets?</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.petPolicy}
                                onChange={(e) => updateData({ petPolicy: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                    </div>

                    {data.petPolicy && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Fee (per stay)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3.5 text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={data.petFee}
                                    onChange={(e) => updateData({ petFee: Number(e.target.value) })}
                                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Children Policy */}
                <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">Children Policy</h4>
                            <p className="text-sm text-gray-500">Are children allowed?</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.childrenPolicy}
                                onChange={(e) => updateData({ childrenPolicy: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
