'use client';

import { useRoleNavigation } from '@/hooks/useRoleNavigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function BottomNavigation() {
    const { showBottomTabs, bottomTabs } = useRoleNavigation();
    const pathname = usePathname();

    // Don't render if not in traveler mode
    if (!showBottomTabs) return null;

    return (
        <AnimatePresence>
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg"
            >
                <div className="max-w-screen-xl mx-auto px-4">
                    <div className="flex items-center justify-around h-16">
                        {bottomTabs.map((tab) => {
                            const isActive = pathname === tab.href ||
                                (tab.href !== '/' && pathname.startsWith(tab.href));

                            return (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className="flex flex-col items-center justify-center flex-1 h-full relative group"
                                >
                                    {/* Active Indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="bottomTabIndicator"
                                            className="absolute top-0 left-1/2 -translate-x-1/2 h-1 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: '60%' }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}

                                    {/* Icon */}
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className={`transition-colors ${isActive ? 'text-rose-600' : 'text-gray-500 group-hover:text-gray-700'
                                            }`}
                                    >
                                        <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                    </motion.div>

                                    {/* Label */}
                                    <span
                                        className={`text-xs mt-1 font-medium transition-colors ${isActive ? 'text-rose-600' : 'text-gray-600 group-hover:text-gray-800'
                                            }`}
                                    >
                                        {tab.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </motion.nav>
        </AnimatePresence>
    );
}
