'use client';

import { useWishlistStore } from '@/store/useWishlistStore';
import Link from 'next/link';

export default function WishlistPage() {
    const { items, removeItem } = useWishlistStore();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-6xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
                <p className="text-gray-600 mb-8">Your saved dream destinations</p>

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                        <div className="text-4xl mb-4">❤️</div>
                        <h2 className="text-xl font-semibold text-gray-900">Your wishlist is empty</h2>
                        <p className="text-gray-500 mt-2">Save places you want to visit later.</p>
                        <Link
                            href="/traveler/discovery"
                            className="mt-6 inline-block bg-rose-600 text-white px-6 py-2 rounded-full font-medium hover:bg-rose-700 transition"
                        >
                            Explore Destinations
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="relative h-48 bg-gray-200">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                                    <p className="text-sm text-gray-500">{item.location}</p>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="font-bold text-rose-600">${item.price}</span>
                                        <Link
                                            href={item.type === 'hotel' ? `/traveler/hotels/${item.id}` : `/traveler/tours/${item.id}`}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                        >
                                            View Details →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
