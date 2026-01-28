'use client';

import { motion } from 'framer-motion';
import { Crown, ChevronRight, Star, MapPin, Calendar, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Simple Image Slider for Cards
function CardImageSlider({ images }: { images: string[] }) {
    const [index, setIndex] = useState(0);

    return (
        <div className="relative w-full h-full group"
            onMouseEnter={() => {
                // Auto slide on hover could go here
            }}
        >
            <img
                src={images[index]}
                className="w-full h-full object-cover transition duration-500 hover:scale-110"
                alt="Hotel"
            />

            {images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition">
                    {images.map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
                        />
                    ))}
                </div>
            )}

            {/* Simple hover navigation zones could be added here for left/right */}
        </div>
    );
}

export function FeaturedHotelsSection() {
    const router = useRouter();

    const hotels = [
        {
            id: 'luxury-beach-1',
            title: 'Paradise Beach Resort',
            location: 'Gwadar, Pakistan',
            price: 599,
            rating: 4.9,
            reviews: 128,
            image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&auto=format&fit=crop&q=80',
            badge: 'Most Popular',
            gradient: 'from-pink-500 to-rose-500'
        },
        {
            id: 'mountain-lodge',
            title: 'Serena Mountain Lodge',
            location: 'Hunza, Pakistan',
            price: 999,
            rating: 4.8,
            reviews: 89,
            image: 'https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6?w=800&auto=format&fit=crop&q=80',
            badge: 'Premium',
            gradient: 'from-blue-500 to-indigo-500'
        },
        {
            id: 'naran-hotel',
            title: 'Pine Top Resort',
            location: 'Naran, Pakistan',
            price: 350,
            rating: 4.6,
            reviews: 210,
            image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&auto=format&fit=crop&q=80',
            badge: 'Best Value',
            gradient: 'from-green-500 to-emerald-500'
        }
    ];

    return (
        <section className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Featured Stays</h3>
                        <p className="text-xs text-gray-500">Handpicked luxury experiences</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/traveler/hotels')}
                    className="text-sm font-medium text-rose-600 flex items-center hover:underline"
                >
                    View All <ChevronRight size={16} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {hotels.map((hotel, i) => (
                    <motion.div
                        key={hotel.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden group cursor-pointer border border-gray-100"
                        onClick={() => router.push(`/traveler/hotels/${hotel.id}`)}
                        whileHover={{ y: -5 }}
                    >
                        <div className="relative h-48 overflow-hidden">
                            <img src={hotel.image} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt={hotel.title} />

                            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${hotel.gradient}`}>
                                {hotel.badge}
                            </div>

                            <button className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-rose-500 transition">
                                <Heart size={16} />
                            </button>
                        </div>

                        <div className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-900 line-clamp-1">{hotel.title}</h4>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <MapPin size={14} />
                                        {hotel.location}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-bold text-gray-900">{hotel.rating}</span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    <span className="block">Total Price</span>
                                    <span className="font-bold text-lg text-gray-900">${hotel.price}</span>
                                </div>
                                <button className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
