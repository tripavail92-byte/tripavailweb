'use client';

import { useRoleNavigation } from '@/hooks/useRoleNavigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function RoleDrawer() {
    const { drawerItems, activeRole } = useRoleNavigation();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Determine role color
    const getRoleColor = () => {
        switch (activeRole) {
            case 'host': return 'from-slate-800 to-slate-900';
            case 'operator': return 'from-emerald-800 to-emerald-900';
            default: return 'from-rose-600 to-pink-600';
        }
    };

    const getRoleTitle = () => {
        switch (activeRole) {
            case 'host': return '🏨 Host Dashboard';
            case 'operator': return '🚐 Operator Dashboard';
            default: return '✈️ Traveler';
        }
    };

    return (
        <>
            {/* Hamburger Menu Button 
                - Hidden on Desktop for Host/Operator (Sidebar takes over) 
                - EXCEPTION: Always show on Onboarding (where Sidebar is hidden)
                - Always visible for Traveler or Mobile
            */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed top-4 left-4 z-30 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow ${((activeRole === 'host' || activeRole === 'operator') && !pathname?.includes('onboarding')) ? 'lg:hidden' : ''
                    }`}
                aria-label="Open menu"
            >
                <Menu size={24} className="text-gray-700" />
            </button>

            {/* Drawer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-80 bg-white z-50 shadow-2xl flex flex-col"
                        >
                            {/* Header */}
                            <div className={`bg-gradient-to-br ${getRoleColor()} text-white p-6`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold">{getRoleTitle()}</h2>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-white/10 rounded-full transition"
                                        aria-label="Close menu"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                <p className="text-sm text-white/80">
                                    {activeRole === 'traveler' ? 'Explore and book amazing stays' :
                                        activeRole === 'host' ? 'Manage your properties' :
                                            'Manage your tour operations'}
                                </p>
                            </div>

                            {/* Menu Items */}
                            <nav className="flex-1 overflow-y-auto p-4">
                                <ul className="space-y-2">
                                    {drawerItems.map((item) => {
                                        const isActive = pathname === item.href ||
                                            (item.href !== '/' && pathname.startsWith(item.href));

                                        return (
                                            <li key={item.id}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                                        ? 'bg-rose-50 text-rose-600 font-semibold'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 text-center">
                                    TripAvail © 2026
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
