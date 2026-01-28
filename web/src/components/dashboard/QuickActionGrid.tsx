'use client';

import { motion } from 'framer-motion';
import { Plane, Hotel, Map, Heart } from 'lucide-react';
import Link from 'next/link';

const actions = [
    {
        icon: Plane,
        label: 'Plan Trip',
        desc: 'Create new journey',
        color: 'bg-blue-50 text-blue-600',
        href: '/traveler/discovery',
    },
    {
        icon: Hotel,
        label: 'Find Hotels',
        desc: 'Best accommodations',
        color: 'bg-emerald-50 text-emerald-600',
        href: '/traveler/hotels',
    },
    {
        icon: Map,
        label: 'Discover Tours',
        desc: 'Local experiences',
        color: 'bg-orange-50 text-orange-600',
        href: '/traveler/tours',
    },
    {
        icon: Heart,
        label: 'My Wishlist',
        desc: 'Saved destinations',
        color: 'bg-rose-50 text-rose-600',
        href: '/traveler/wishlist',
    },
];

export function QuickActionGrid() {
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {actions.map((action, index) => (
                <Link key={action.label} href={action.href}>
                    <motion.div
                        whileHover={{ y: -5, boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-gray-200"
                    >
                        <div className={`mb-4 w-fit rounded-xl p-3 ${action.color}`}>
                            <action.icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{action.label}</h3>
                            <p className="text-sm text-gray-500">{action.desc}</p>
                        </div>
                    </motion.div>
                </Link>
            ))}
        </div>
    );
}
