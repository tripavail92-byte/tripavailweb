'use client';

import { useUserStore } from '@/store/useUserStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function RoleTransitionWrapper({ children }: { children: React.ReactNode }) {
    const { activeRole, setActiveRole, isFlipping, stopFlip } = useUserStore();
    const pathname = usePathname();

    // Sync role with URL path (Source of Truth)
    useEffect(() => {
        if (pathname?.startsWith('/host') && activeRole !== 'host') {
            setActiveRole('host');
        } else if (pathname?.startsWith('/operator') && activeRole !== 'operator') {
            setActiveRole('operator');
        }
    }, [pathname, activeRole, setActiveRole]);

    // Sync rotation with role
    useEffect(() => {
        if (isFlipping) {
            const timeout = setTimeout(() => {
                stopFlip();
            }, 1000); // 1s flip duration
            return () => clearTimeout(timeout);
        }
    }, [isFlipping, stopFlip]);

    // Determine background based on role
    const getBackground = () => {
        switch (activeRole) {
            case 'host': return 'bg-slate-900';
            case 'operator': return 'bg-emerald-900';
            default: return 'bg-white';
        }
    };

    return (
        <div className={`relative min-h-screen overflow-hidden ${getBackground()} transition-colors duration-500`}>
            <AnimatePresence mode='wait'>
                {/* Enhanced 3D Flip Animation with Gradient Overlay */}
                {isFlipping && (
                    <motion.div
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -90, opacity: 0 }}
                        transition={{ duration: 1.0, ease: "easeInOut" }}
                        className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
                        style={{
                            perspective: 1200,
                            background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.4), rgba(236, 72, 153, 0.4), rgba(251, 146, 60, 0.4))'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-white text-3xl font-bold text-center"
                        >
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-8 py-6 border border-white/20">
                                <div className="animate-pulse">
                                    Switching Mode...
                                </div>
                                <div className="text-sm font-normal mt-2 text-white/80">
                                    {activeRole === 'traveler' ? '✈️ Traveler' :
                                        activeRole === 'host' ? '🏨 Host' :
                                            '🚐 Operator'}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                animate={{
                    filter: isFlipping ? 'blur(15px) brightness(0.5)' : 'blur(0px) brightness(1)',
                    scale: isFlipping ? 0.95 : 1
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full w-full"
            >
                {children}
            </motion.div>
        </div>
    );
}
