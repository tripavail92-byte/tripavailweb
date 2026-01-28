'use client';

import { Room, useHostOnboardingStore } from '@/store/useHostOnboardingStore';
import { Plus, Trash2, Bed } from 'lucide-react';
import { useState } from 'react';

export function RoomDetailsStep() {
    const { data, addRoom, removeRoom } = useHostOnboardingStore();
    const [isAdding, setIsAdding] = useState(data.rooms.length === 0);

    // Temporary state for new room form
    const [newRoom, setNewRoom] = useState<Partial<Room>>({
        name: '',
        basePrice: 0,
        maxOccupancy: 2,
        bedType: 'Queen',
    });

    const handleAddRoom = () => {
        if (!newRoom.name || !newRoom.basePrice) return;

        addRoom({
            id: crypto.randomUUID(),
            name: newRoom.name || 'Standard Room',
            description: '',
            maxOccupancy: newRoom.maxOccupancy || 2,
            bedType: newRoom.bedType || 'Queen',
            basePrice: Number(newRoom.basePrice),
            roomSize: 0,
            amenities: [],
            photos: [],
        });

        // Reset form and toggle view
        setNewRoom({ name: '', basePrice: 0, maxOccupancy: 2, bedType: 'Queen' });
        setIsAdding(false);
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Add Room Types</h2>
                <p className="text-gray-500">List the different types of rooms available.</p>
            </div>

            <div className="space-y-4">
                {/* Existing Rooms List */}
                {data.rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                                <Bed size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">{room.name}</h4>
                                <p className="text-sm text-gray-500">{room.bedType} Bed • Max {room.maxOccupancy} Guests • ${room.basePrice}/night</p>
                            </div>
                        </div>
                        <button
                            onClick={() => removeRoom(room.id)}
                            className="text-gray-400 hover:text-red-500 transition"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {/* Add Room Form */}
                {isAdding ? (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                        <h4 className="font-semibold text-gray-900">New Room Details</h4>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Deluxe Ocean View"
                                value={newRoom.name}
                                onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night ($)</label>
                                <input
                                    type="number"
                                    placeholder="150"
                                    value={newRoom.basePrice}
                                    onChange={(e) => setNewRoom(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Occupancy</label>
                                <input
                                    type="number"
                                    placeholder="2"
                                    value={newRoom.maxOccupancy}
                                    onChange={(e) => setNewRoom(prev => ({ ...prev, maxOccupancy: Number(e.target.value) }))}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={handleAddRoom}
                                className="flex-1 bg-rose-600 text-white py-2 rounded-lg font-medium hover:bg-rose-700"
                            >
                                Save Room
                            </button>
                            <button
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-gray-400 hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        Add Another Room
                    </button>
                )}
            </div>
        </div>
    );
}
