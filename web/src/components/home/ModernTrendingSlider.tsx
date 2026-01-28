'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Flame, ChevronLeft, ChevronRight, Plane } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ModernTrendingSlider() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);

    const destinations = [
        {
            id: 'santorini',
            name: 'Santorini',
            country: 'Greece',
            price: 'From $899',
            image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
            description: 'Stunning sunsets and white architecture'
        },
        {
            id: 'bali',
            name: 'Bali',
            country: 'Indonesia',
            price: 'From $599',
            image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
            description: 'Tropical paradise and cultural wonders'
        },
        {
            id: 'hunza',
            name: 'Hunza Valley',
            country: 'Pakistan',
            price: 'From $450',
            image: 'https://images.unsplash.com/photo-1682685793600-0c1643e66c9d?w=1080&auto=format&fit=crop&q=80',
            description: 'Majestic mountains and ancient forts'
        },
        {
            id: 'dubai',
            name: 'Dubai',
            country: 'UAE',
            price: 'From $1199',
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
            description: 'Luxury shopping and desert adventures'
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % destinations.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [destinations.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % destinations.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + destinations.length) % destinations.length);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                        <TrendingUp className="w-5 h-5 text-rose-500" />
                    </motion.div>
                    <h3 className="font-bold text-lg text-gray-900">Trending Destinations</h3>
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Flame className="w-5 h-5 text-orange-500" />
                    </motion.div>
                </div>
                <button
                    onClick={() => router.push('/traveler/discovery')}
                    className="text-sm font-medium text-rose-600 hover:text-rose-700 hover:underline"
                >
                    View All
                </button>
            </div>

            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl group">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentSlide}
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <img
                            src={destinations[currentSlide].image}
                            alt={destinations[currentSlide].name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                <button
                    onClick={prevSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-white/40 border border-white/30 text-white"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-white/40 border border-white/30 text-white"
                >
                    <ChevronRight size={20} />
                </button>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white z-10">
                    <motion.div
                        key={`text-${currentSlide}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-2xl"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-2">{destinations[currentSlide].name}</h2>
                        <div className="flex items-center gap-2 text-lg md:text-xl text-white/90 mb-4">
                            <span>{destinations[currentSlide].country}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                            <span className="font-semibold text-rose-400">{destinations[currentSlide].price}</span>
                        </div>
                        <p className="text-white/80 mb-6 max-w-lg">{destinations[currentSlide].description}</p>

                        <button
                            onClick={() => router.push('/traveler/discovery')}
                            className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 transition active:scale-95"
                        >
                            <Plane size={18} />
                            Explore Now
                        </button>
                    </motion.div>
                </div>

                {/* Indicators */}
                <div className="absolute bottom-6 right-6 flex gap-2">
                    {destinations.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
