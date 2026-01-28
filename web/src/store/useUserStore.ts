import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'traveler' | 'host' | 'operator';

interface UserState {
    activeRole: UserRole;
    isFlipping: boolean;
    setActiveRole: (role: UserRole) => void;
    startFlip: () => void;
    stopFlip: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            activeRole: 'traveler',
            isFlipping: false,

            setActiveRole: (role) => set({ activeRole: role }),

            startFlip: () => set({ isFlipping: true }),
            stopFlip: () => set({ isFlipping: false }),
        }),
        {
            name: 'tripavail-user-settings',
            partialize: (state) => ({ activeRole: state.activeRole }), // Don't persist isFlipping
        }
    )
);
