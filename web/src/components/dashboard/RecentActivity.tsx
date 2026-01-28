'use client';

import { motion } from 'framer-motion';
import { Plane, Star, Heart, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const activities = [
    {
        id: 1,
        type: 'trip',
        title: 'Completed Hunza Valley Explorer',
        desc: 'Amazing 5-day cultural experience',
        time: '2 days ago',
        icon: Plane,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        href: '/traveler/trips/1',
    },
    {
        id: 2,
        type: 'review',
        title: 'Reviewed Serena Hotels',
        desc: 'Left a 5-star review with photos',
        time: '1 week ago',
        icon: Star,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        href: '/reviews',
    },
    {
        id: 3,
        type: 'wishlist',
        title: 'Saved Skardu Resort',
        desc: 'Added to winter travel wishlist',
        time: '2 weeks ago',
        icon: Heart,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        href: '/traveler/wishlist',
    },
];

export function RecentActivity() {
    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="text-gray-400" size={20} />
                    <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
            </div>

            <div className="space-y-4">
                {activities.map((activity, index) => (
                    <Link key={activity.id} href={activity.href}>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            whileHover={{ x: 5 }}
                            className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-gray-50"
                        >
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${activity.bg}`}>
                                <activity.icon className={`h-5 w-5 ${activity.color}`} />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{activity.title}</p>
                                <p className="text-xs text-gray-500">{activity.desc}</p>
                            </div>
                            <span className="text-xs font-medium text-gray-400">{activity.time}</span>
                        </motion.div>
                    </Link>
                ))}
            </div>

            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50">
                View All Activity
                <ChevronRight size={16} />
            </button>
        </div>
    );
}
