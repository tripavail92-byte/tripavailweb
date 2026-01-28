import { useUserStore } from '@/store/useUserStore';
import { useAuth } from '@/hooks/useAuth';
import { Home, Search, Calendar, MessageCircle, User, Hotel, Package, DollarSign, BarChart3, Settings, Heart, Briefcase } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
    id: string;
    label: string;
    icon: LucideIcon;
    href: string;
}

const TRAVELER_TABS: NavigationItem[] = [
    { id: 'home', label: 'Home', icon: Home, href: '/' },
    { id: 'search', label: 'Search', icon: Search, href: '/search' },
    { id: 'bookings', label: 'Trips', icon: Calendar, href: '/traveler/bookings' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, href: '/messages' },
    { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
];

const HOST_DRAWER_ITEMS: NavigationItem[] = [
    { id: 'hotels', label: 'My Hotels', icon: Hotel, href: '/host' },
    { id: 'packages', label: 'Packages', icon: Package, href: '/host/packages' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, href: '/host/bookings' },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, href: '/host/earnings' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/host/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/host/settings' },
];

const OPERATOR_DRAWER_ITEMS: NavigationItem[] = [
    { id: 'tours', label: 'My Tours', icon: Package, href: '/operator' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, href: '/operator/bookings' },
    { id: 'earnings', label: 'Earnings', icon: DollarSign, href: '/operator/earnings' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/operator/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/operator/settings' },
];

const TRAVELER_DRAWER_ITEMS: NavigationItem[] = [
    { id: 'trips', label: 'My Trips', icon: Calendar, href: '/traveler/bookings' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, href: '/wishlist' },
    { id: 'become-partner', label: 'Become a Partner', icon: Briefcase, href: '/become-partner' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
];

export function useRoleNavigation() {
    const { activeRole } = useUserStore();
    const { user } = useAuth();

    const canAccessHost = !!user?.profiles?.some(p => p.providerType === 'HOTEL_MANAGER');
    const canAccessOperator = !!user?.profiles?.some(p => p.providerType === 'TOUR_OPERATOR');

    const getDrawerItems = (): NavigationItem[] => {
        switch (activeRole) {
            case 'host':
                return HOST_DRAWER_ITEMS;
            case 'operator':
                return OPERATOR_DRAWER_ITEMS;
            default:
                return TRAVELER_DRAWER_ITEMS;
        }
    };

    return {
        activeRole,
        showBottomTabs: activeRole === 'traveler',
        bottomTabs: TRAVELER_TABS,
        drawerItems: getDrawerItems(),
        canAccessHost,
        canAccessOperator,
    };
}
