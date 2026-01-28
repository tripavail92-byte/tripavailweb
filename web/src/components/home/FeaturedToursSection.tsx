'use client';

import { motion } from 'framer-motion';
import { Mountain, ChevronRight, Star, Clock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function FeaturedToursSection() {
    const router = useRouter();

    const tours = [
        {
            id: 'k2-basecamp',
            title: 'K2 Basecamp Trek',
            location: 'Skardu, Pakistan',
            price: 1200,
            days: 14,
            groupSize: 'Max 12',
            rating: 5.0,
            image: 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=800&auto=format&fit=crop&q=80',
            gradient: 'from-orange-500 to-red-500'
        },
        {
            id: 'fairy-meadows',
            title: 'Fairy Meadows Expedition',
            location: 'Gilgit, Pakistan',
            price: 450,
            days: 5,
            groupSize: 'Max 20',
            rating: 4.8,
            image: 'https://images.unsplash.com/photo-1549524456-c7359149a46f?w=800&auto=format&fit=crop&q=80',
            gradient: 'from-purple-500 to-indigo-500'
        },
        {
            id: 'culture-lahore',
            title: 'Lahore Heritage Walk',
            location: 'Lahore, Pakistan',
            price: 50,
            days: 1,
            groupSize: 'Max 15',
            rating: 4.7,
            image: 'https://images.unsplash.com/photo-1598556536965-f4852c10b4f0?w=800&auto=format&fit=crop&q=80',
            gradient: 'from-teal-500 to-emerald-500'
        }
    ];

    return (
        <section className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Mountain className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">Top Rated Tours</h3>
                        <p className="text-xs text-gray-500">Unforgettable guided adventures</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/traveler/tours')}
                    className="text-sm font-medium text-rose-600 flex items-center hover:underline"
                >
                    View All <ChevronRight size={16} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tours.map((tour, i) => (
                    <motion.div
                        key={tour.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden group cursor-pointer border border-gray-100"
                        onClick={() => router.push(`/traveler/tours/${tour.id}`)}
                        whileHover={{ y: -5 }}
                    >
                        <div className="relative h-48 overflow-hidden">
                            <img src={tour.image} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" alt={tour.title} />

                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                <span className="text-white font-bold text-lg">${tour.price}</span>
                                <span className="text-white/80 text-xs ml-1">/ person</span>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-900 line-clamp-1 flex-1">{tour.title}</h4>
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs font-bold text-gray-900">{tour.rating}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Clock size={14} className="text-gray-400" />
                                    {tour.days} Days
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users size={14} className="text-gray-400" />
                                    {tour.groupSize}
                                </div>
                            </div>

                            <button className={`w-full py-2.5 rounded-xl text-white font-bold text-sm bg-gradient-to-r ${tour.gradient} hover:opacity-90 transition shadow-md`}>
                                View Itinerary
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
