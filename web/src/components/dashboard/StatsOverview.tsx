'use client';

import { motion } from 'framer-motion';
import { Trophy, Globe, MapPin, Award } from 'lucide-react';

const stats = [
    {
        label: 'Trips Completed',
        value: '12',
        icon: Trophy,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        trend: '+2 this month',
    },
    {
        label: 'Countries Visited',
        value: '8',
        icon: Globe,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        trend: 'New: Indonesia',
    },
    {
        label: 'Cities Explored',
        value: '24',
        icon: MapPin,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        trend: 'Last: Ubud',
    },
    {
        label: 'Reward Points',
        value: '2,450',
        icon: Award,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        trend: 'Silver Tier',
    },
];

export function StatsOverview() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
                    className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                            <h3 className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</h3>
                            <p className={`mt-2 text-xs font-medium ${stat.color}`}>{stat.trend}</p>
                        </div>
                        <div className={`rounded-xl p-3 ${stat.bg}`}>
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
