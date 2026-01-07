# 🎯 COMPREHENSIVE PROJECT TODO LIST - January 7, 2026

> **Status:** Backend is 95% ready (skipping Stripe, reviews, advanced search)  
> **Focus:** Partner Workspace Architecture + Frontend Polish  
> **Estimated Timeline:** 8-10 business days  
> **Team Capacity:** 1 person (you)

---

## 📊 PROJECT OVERVIEW

### What You're Building
1. **Partner Workspace** - Unified hub for hotel managers & tour operators
2. **Role Switching** - Seamless traveler → partner → traveler transitions
3. **Micro-Flows** - 4 critical creation flows (hotel listing, package creation, tour creation)
4. **UI Polish** - Mobile-quality responsive design
5. **State Management** - Clean React state for complex multi-step flows

### Architecture Changes Needed
```
BEFORE (Current - Fragmented)
/host → HostDashboard
/operator/tours → OperatorToursPage (no dashboard)
/traveler/discovery → DiscoveryPage
❌ No unified partner entry
❌ No role switching
❌ Fragmented navigation

AFTER (New - Unified)
/partner → Auto-detect role → /partner/hotel or /partner/operator
/traveler → Traveler mode (separate from partner)
/traveler/discovery → Browse packages
✅ Unified partner entry
✅ Role switching component
✅ Consistent navigation
```

---

## 🚀 PHASE 1: QUICK UI FIXES (Today - 4 hours)

### Priority 1.1: Mobile Responsiveness ⏱️ 1 hour

**Files to modify:**
- `web/src/app/traveler/discovery/page.tsx`
- `web/src/app/host/page.tsx`
- `web/src/components/LocationAutocomplete.tsx`
- `web/src/components/LocationMap.tsx`

**Tasks:**
- [ ] Add Tailwind responsive breakpoints (sm:, md:, lg:)
  - Homepage: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Discovery: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
  - Cards: Adjust padding `p-4 md:p-6` for mobile screens

- [ ] Test on mobile (375px), tablet (768px), desktop (1280px)
  - Use DevTools device emulation
  - Check button sizing (min 44px tap target)
  - Verify image scaling

- [ ] Fix overflow issues
  - Ensure modals don't exceed viewport
  - Tables should scroll horizontally on mobile
  - Maps should be constrained to screen width

**Acceptance Criteria:**
- ✅ All pages usable on 375px width
- ✅ No horizontal scroll on mobile
- ✅ Buttons are 44x44px minimum
- ✅ Images scale proportionally

---

### Priority 1.2: Loading Skeletons ⏱️ 1 hour

**Files to create:**
- `web/src/components/ui/SkeletonLoader.tsx`
- `web/src/components/ui/CardSkeleton.tsx`
- `web/src/components/ui/TableSkeleton.tsx`

**Tasks:**
- [ ] Create reusable skeleton components
  ```tsx
  // web/src/components/ui/SkeletonLoader.tsx
  export function SkeletonLoader({ height = 'h-8', width = 'w-full', rounded = 'rounded' }) {
    return <div className={`${height} ${width} ${rounded} bg-gray-200 animate-pulse`} />;
  }
  
  export function CardSkeleton() {
    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <SkeletonLoader height="h-12" width="w-3/4" />
        <SkeletonLoader height="h-8" width="w-full" />
        <SkeletonLoader height="h-8" width="w-5/6" />
      </div>
    );
  }
  
  export function TableSkeleton({ rows = 5 }) {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map(i => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: 4 }).map(j => (
              <SkeletonLoader key={j} height="h-8" width="w-1/4" />
            ))}
          </div>
        ))}
      </div>
    );
  }
  ```

- [ ] Replace text loading states
  - `admin/providers/page.tsx`: Replace loading spinner text with `<CardSkeleton />`
  - `admin/users/page.tsx`: Use `<TableSkeleton />`
  - `traveler/discovery/page.tsx`: Use grid of `<CardSkeleton />`

- [ ] Test skeleton display
  - Add artificial 2s delay to verify appearance
  - Check mobile display

**Acceptance Criteria:**
- ✅ No "Loading..." text visible anywhere
- ✅ Skeletons match final card dimensions
- ✅ Smooth animation (not jarring)

---

### Priority 1.3: Button Consistency ⏱️ 1 hour

**Files to modify:**
- `web/src/components/ui/Button.tsx` (create if doesn't exist)
- All pages using buttons

**Tasks:**
- [ ] Create unified Button component
  ```tsx
  // web/src/components/ui/Button.tsx
  interface ButtonProps {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
  }
  
  export function Button({
    label,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon,
  }: ButtonProps) {
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    };
    
    const sizes = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    
    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          ${variants[variant]}
          ${sizes[size]}
          rounded-lg font-medium transition-colors
          ${fullWidth ? 'w-full' : ''}
          ${(disabled || loading) ? 'opacity-50 cursor-not-allowed' : ''}
          flex items-center justify-center gap-2
        `}
      >
        {loading ? <Spinner /> : icon}
        {label}
      </button>
    );
  }
  ```

- [ ] Audit all buttons in codebase
  - Search for inline button styles
  - Replace with `<Button />` component
  - Verify colors match brand (blue primary, gray secondary)

- [ ] Test button states
  - Default state
  - Hover state
  - Disabled state
  - Loading state

**Acceptance Criteria:**
- ✅ All buttons use unified component
- ✅ Consistent colors/styling
- ✅ Min 44px height (mobile accessible)
- ✅ Proper disabled/loading states

---

### Priority 1.4: Empty States with CTAs ⏱️ 0.5 hours

**Files to create:**
- `web/src/components/ui/EmptyState.tsx`

**Tasks:**
- [ ] Create EmptyState component
  ```tsx
  interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  }
  
  export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="w-16 h-16 text-gray-400 mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
        {action && (
          <Button
            label={action.label}
            onClick={action.onClick}
            variant="primary"
          />
        )}
      </div>
    );
  }
  ```

- [ ] Replace empty state text
  - `admin/providers/page.tsx`: "No providers" → `<EmptyState />`
  - `admin/users/page.tsx`: "No users" → `<EmptyState />`
  - `host/page.tsx`: "No packages" → `<EmptyState />`

**Acceptance Criteria:**
- ✅ Icons visible and appropriately sized
- ✅ CTA button present and functional
- ✅ Copy is clear and helpful

---

### Priority 1.5: Semantic HTML ⏱️ 0.5 hours

**Files to audit:**
- All pages using `<div>` where semantics apply

**Tasks:**
- [ ] Add semantic tags
  ```tsx
  // BEFORE
  <div className="bg-white p-4">
    <div className="text-2xl font-bold">Title</div>
    ...
  </div>
  
  // AFTER
  <main className="bg-white p-4">
    <header>
      <h1 className="text-2xl font-bold">Title</h1>
    </header>
    ...
  </main>
  ```

- [ ] Update all pages to use:
  - `<main>` for main content
  - `<header>` for page headers
  - `<nav>` for navigation
  - `<section>` for logical sections
  - `<footer>` for footers

- [ ] Add ARIA labels where needed
  - Buttons with icons: `aria-label="Close"`
  - Loading states: `aria-busy="true"`

**Acceptance Criteria:**
- ✅ Proper semantic HTML structure
- ✅ ARIA labels on interactive elements
- ✅ Lighthouse accessibility score > 85

---

## ⏸️ AFTER PHASE 1 - CHECKPOINT

**Time Elapsed:** ~4 hours  
**Status:** ✅ UI is polished, mobile-responsive, accessible  
**Next:** Move to Partner Workspace architecture

**Deploy to Vercel after Phase 1**

---

## 🏗️ PHASE 2: PARTNER WORKSPACE ARCHITECTURE (Days 2-3 - 16 hours)

### Priority 2.1: Create `/partner` Route Structure ⏱️ 2 hours

**Files to create:**
```
web/src/app/partner/
├── layout.tsx                 # Shared partner layout
├── page.tsx                   # Auto-detect role, redirect
├── hotel/
│   ├── layout.tsx            # Hotel-specific layout
│   ├── page.tsx              # Hotel Manager Dashboard
│   ├── packages/
│   ├── properties/
│   ├── settings/
│   └── analytics/
└── operator/
    ├── layout.tsx            # Operator-specific layout
    ├── page.tsx              # Tour Operator Dashboard
    ├── tours/
    ├── departures/
    ├── settings/
    └── analytics/
```

**Tasks:**
- [ ] Create `/partner/layout.tsx`
  ```tsx
  // Shared partner layout
  'use client';
  
  import { useAuth } from '@/hooks/useAuth';
  import { useRouter } from 'next/navigation';
  import { PartnerNav } from '@/components/partner/PartnerNav';
  
  export default function PartnerLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const router = useRouter();
    
    // Redirect if not authenticated as partner
    if (!user?.profiles?.length) {
      router.push('/become-a-partner');
      return null;
    }
    
    return (
      <div className="min-h-screen bg-gray-50">
        <PartnerNav profiles={user.profiles} />
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    );
  }
  ```

- [ ] Create `/partner/page.tsx` (auto-redirect)
  ```tsx
  'use client';
  
  import { useAuth } from '@/hooks/useAuth';
  import { useRouter } from 'next/navigation';
  import { useEffect } from 'react';
  
  export default function PartnerPage() {
    const { user } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!user?.profiles?.length) {
        router.push('/become-a-partner');
        return;
      }
      
      // Auto-detect primary role
      const primaryRole = user.profiles[0].providerType;
      const targetRoute = primaryRole === 'HOTEL_MANAGER'
        ? '/partner/hotel'
        : '/partner/operator';
      
      router.replace(targetRoute);
    }, [user, router]);
    
    return <div>Loading partner workspace...</div>;
  }
  ```

- [ ] Create `/partner/hotel/layout.tsx` and `/partner/operator/layout.tsx`
  - Inherit from parent layout
  - Add role-specific sidebar navigation

**Acceptance Criteria:**
- ✅ `/partner` redirects to appropriate dashboard
- ✅ Both `/partner/hotel` and `/partner/operator` accessible
- ✅ Back button works correctly

---

### Priority 2.2: Create Theme Configuration ⏱️ 1 hour

**Files to create:**
- `web/src/lib/partner-theme.ts`
- `web/src/lib/role-utils.ts`

**Tasks:**
- [ ] Create theme config
  ```typescript
  // web/src/lib/partner-theme.ts
  
  export type PartnerRole = 'HOTEL_MANAGER' | 'TOUR_OPERATOR' | 'ADMIN';
  
  export interface RoleTheme {
    name: string;
    gradient: string;
    gradientDark: string;
    color: string;
    colorLight: string;
    colorDark: string;
    icon: React.ReactNode;
  }
  
  export const PARTNER_THEMES: Record<PartnerRole, RoleTheme> = {
    HOTEL_MANAGER: {
      name: 'Hotel Manager',
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      gradientDark: 'from-blue-600 via-blue-700 to-blue-800',
      color: 'text-blue-600',
      colorLight: 'text-blue-500',
      colorDark: 'text-blue-700',
      icon: '🏨',
    },
    TOUR_OPERATOR: {
      name: 'Tour Operator',
      gradient: 'from-purple-500 via-purple-600 to-purple-700',
      gradientDark: 'from-purple-600 via-purple-700 to-purple-800',
      color: 'text-purple-600',
      colorLight: 'text-purple-500',
      colorDark: 'text-purple-700',
      icon: '🚌',
    },
    ADMIN: {
      name: 'Admin',
      gradient: 'from-gray-700 via-gray-800 to-gray-900',
      gradientDark: 'from-gray-800 via-gray-900 to-black',
      color: 'text-gray-700',
      colorLight: 'text-gray-600',
      colorDark: 'text-gray-900',
      icon: '⚙️',
    },
  };
  
  export const STAT_CARD_ICONS = {
    HOTEL_MANAGER: {
      totalHotels: '🏨',
      activePackages: '📦',
      bookings: '🔖',
      revenue: '💰',
    },
    TOUR_OPERATOR: {
      activeTours: '🗺️',
      departures: '📅',
      bookings: '🔖',
      revenue: '💰',
    },
  };
  ```

- [ ] Create role utilities
  ```typescript
  // web/src/lib/role-utils.ts
  
  export function getThemeForRole(role: string): RoleTheme {
    return PARTNER_THEMES[role as PartnerRole] || PARTNER_THEMES.ADMIN;
  }
  
  export function getRoleDisplayName(role: string): string {
    return getThemeForRole(role).name;
  }
  
  export function isDashboardRole(role: string): boolean {
    return ['HOTEL_MANAGER', 'TOUR_OPERATOR'].includes(role);
  }
  ```

**Acceptance Criteria:**
- ✅ Gradients are consistent across app
- ✅ Theme colors match brand guidelines
- ✅ Easy to switch between roles

---

### Priority 2.3: Create Shared Dashboard Components ⏱️ 3 hours

**Files to create:**
```
web/src/components/partner/
├── DashboardHero.tsx          # Gradient hero section
├── StatCard.tsx               # Single stat card
├── StatCardGrid.tsx           # Grid of stats
├── QuickActions.tsx           # Action buttons
├── RoleSwitcher.tsx           # Role selector
├── RecentActivity.tsx         # Recent packages/tours
├── PartnerNav.tsx             # Partner navigation
└── index.ts                   # Barrel export
```

**Tasks:**
- [ ] Create `DashboardHero.tsx`
  ```tsx
  import { PARTNER_THEMES } from '@/lib/partner-theme';
  
  interface DashboardHeroProps {
    profile: any;
    role: string;
  }
  
  export function DashboardHero({ profile, role }: DashboardHeroProps) {
    const theme = PARTNER_THEMES[role as any];
    
    return (
      <div className={`bg-gradient-to-r ${theme.gradient} text-white p-8 rounded-lg mb-8`}>
        <div className="flex items-center gap-6">
          {profile?.logo && (
            <img
              src={profile.logo}
              alt={profile.businessName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{profile?.businessName}</h1>
            <p className="text-blue-100 mb-4">
              {role === 'HOTEL_MANAGER' ? '🏨 Hotel Manager' : '🚌 Tour Operator'}
            </p>
            {profile?.verificationStatus && (
              <VerificationBadge status={profile.verificationStatus} />
            )}
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] Create `StatCard.tsx`
  ```tsx
  interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    theme: any;
  }
  
  export function StatCard({ icon, label, value, trend, trendValue, theme }: StatCardProps) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-sm mt-2 ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
              </p>
            )}
          </div>
          <div className="text-3xl">{icon}</div>
        </div>
      </div>
    );
  }
  ```

- [ ] Create `StatCardGrid.tsx`
  ```tsx
  interface StatCardGridProps {
    stats: Array<{
      icon: React.ReactNode;
      label: string;
      value: string | number;
      trend?: 'up' | 'down' | 'neutral';
      trendValue?: string;
    }>;
    theme: any;
  }
  
  export function StatCardGrid({ stats, theme }: StatCardGridProps) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <StatCard key={stat.label} {...stat} theme={theme} />
        ))}
      </div>
    );
  }
  ```

- [ ] Create `QuickActions.tsx`
  ```tsx
  interface QuickAction {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }
  
  interface QuickActionsProps {
    actions: QuickAction[];
    theme: any;
  }
  
  export function QuickActions({ actions, theme }: QuickActionsProps) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {actions.map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`bg-gradient-to-br ${theme.gradient} text-white p-6 rounded-lg hover:shadow-lg transition-shadow flex flex-col items-center gap-3`}
          >
            <div className="text-3xl">{action.icon}</div>
            <span className="font-medium text-center">{action.label}</span>
          </button>
        ))}
      </div>
    );
  }
  ```

- [ ] Create `RoleSwitcher.tsx`
  ```tsx
  import { useState } from 'react';
  import { useRouter } from 'next/navigation';
  
  interface RoleSwitcherProps {
    profiles: any[];
    activeRole: string;
    onSwitch: (role: string) => void;
  }
  
  export function RoleSwitcher({ profiles, activeRole, onSwitch }: RoleSwitcherProps) {
    if (profiles.length <= 1) return null;
    
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Switch to:</span>
        <select
          value={activeRole}
          onChange={e => onSwitch(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white"
        >
          {profiles.map(profile => (
            <option key={profile.providerType} value={profile.providerType}>
              {profile.providerType === 'HOTEL_MANAGER' ? 'Hotel Manager' : 'Tour Operator'}
            </option>
          ))}
        </select>
      </div>
    );
  }
  ```

- [ ] Create `PartnerNav.tsx` (navigation for partner area)
- [ ] Create `RecentActivity.tsx` (list recent packages/tours)

**Acceptance Criteria:**
- ✅ All components render without errors
- ✅ Theme colors applied correctly
- ✅ Components are reusable across hotel/operator dashboards

---

### Priority 2.4: Build Hotel Manager Dashboard ⏱️ 3 hours

**Files to create/modify:**
- `web/src/app/partner/hotel/page.tsx`

**Tasks:**
- [ ] Create hotel dashboard page
  ```tsx
  'use client';
  
  import { useEffect, useState, useMemo } from 'react';
  import { useRouter } from 'next/navigation';
  import { useAuth } from '@/hooks/useAuth';
  import { listHotelPackages } from '@/lib/api-client';
  import { DashboardHero, StatCardGrid, QuickActions, RecentActivity } from '@/components/partner';
  import { PARTNER_THEMES } from '@/lib/partner-theme';
  
  export default function HotelManagerDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const profile = useMemo(
      () => user?.profiles?.find(p => p.providerType === 'HOTEL_MANAGER'),
      [user]
    );
    
    const theme = PARTNER_THEMES.HOTEL_MANAGER;
    
    useEffect(() => {
      if (!profile) {
        router.push('/become-a-partner');
        return;
      }
      
      loadData();
    }, [profile, router]);
    
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await listHotelPackages({ providerId: profile?.id });
        setPackages(response.items || []);
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const stats = useMemo(() => {
      const total = packages.length;
      const published = packages.filter(p => p.status === 'PUBLISHED').length;
      const draft = packages.filter(p => p.status === 'DRAFT').length;
      const revenue = packages
        .filter(p => p.status === 'PUBLISHED')
        .reduce((sum, p) => sum + (p.pricePerPerson || 0), 0);
      
      return [
        { icon: '🏨', label: 'Total Packages', value: total },
        { icon: '✅', label: 'Published', value: published },
        { icon: '📝', label: 'Drafts', value: draft },
        { icon: '💰', label: 'Revenue', value: `₹${revenue.toLocaleString()}` },
      ];
    }, [packages]);
    
    const actions = [
      { icon: '➕', label: 'New Package', onClick: () => router.push('/partner/hotel/packages/new') },
      { icon: '🏠', label: 'Add Property', onClick: () => router.push('/partner/hotel/properties/new') },
      { icon: '📊', label: 'Analytics', onClick: () => router.push('/partner/hotel/analytics') },
      { icon: '⚙️', label: 'Settings', onClick: () => router.push('/partner/hotel/settings') },
    ];
    
    if (loading) return <div>Loading...</div>;
    
    return (
      <div>
        <DashboardHero profile={profile} role="HOTEL_MANAGER" />
        <StatCardGrid stats={stats} theme={theme} />
        <QuickActions actions={actions} theme={theme} />
        <RecentActivity items={packages.slice(0, 5)} type="package" theme={theme} />
      </div>
    );
  }
  ```

- [ ] Verify all stat calculations are correct
- [ ] Add error handling and retry logic
- [ ] Test with mock data

**Acceptance Criteria:**
- ✅ Dashboard loads and displays stats
- ✅ Quick actions navigate correctly
- ✅ Recent activity shows latest packages
- ✅ Responsive on mobile

---

### Priority 2.5: Build Tour Operator Dashboard ⏱️ 3 hours

**Files to create/modify:**
- `web/src/app/partner/operator/page.tsx`

**Tasks:**
- [ ] Create operator dashboard page (MISSING currently!)
  ```tsx
  'use client';
  
  import { useEffect, useState, useMemo } from 'react';
  import { useRouter } from 'next/navigation';
  import { useAuth } from '@/hooks/useAuth';
  import { apiFetch } from '@/lib/api-client';
  import { DashboardHero, StatCardGrid, QuickActions, RecentActivity } from '@/components/partner';
  import { PARTNER_THEMES } from '@/lib/partner-theme';
  
  export default function TourOperatorDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [tours, setTours] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const profile = useMemo(
      () => user?.profiles?.find(p => p.providerType === 'TOUR_OPERATOR'),
      [user]
    );
    
    const theme = PARTNER_THEMES.TOUR_OPERATOR;
    
    useEffect(() => {
      if (!profile) {
        router.push('/become-a-partner');
        return;
      }
      
      loadData();
    }, [profile, router]);
    
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await apiFetch(`/v1/tour-packages?providerId=${profile?.id}`);
        setTours(response.items || response.data || []);
      } catch (err) {
        console.error('Failed to load tours:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const stats = useMemo(() => {
      const total = tours.length;
      const published = tours.filter(t => t.status === 'PUBLISHED').length;
      const draft = tours.filter(t => t.status === 'DRAFT').length;
      const revenue = tours
        .filter(t => t.status === 'PUBLISHED')
        .reduce((sum, t) => sum + (t.pricePerPerson || 0), 0);
      
      return [
        { icon: '🗺️', label: 'Active Tours', value: total },
        { icon: '✅', label: 'Published', value: published },
        { icon: '📝', label: 'Drafts', value: draft },
        { icon: '💰', label: 'Revenue', value: `₹${revenue.toLocaleString()}` },
      ];
    }, [tours]);
    
    const actions = [
      { icon: '➕', label: 'New Tour', onClick: () => router.push('/partner/operator/tours/new') },
      { icon: '📅', label: 'Departures', onClick: () => router.push('/partner/operator/departures') },
      { icon: '📊', label: 'Analytics', onClick: () => router.push('/partner/operator/analytics') },
      { icon: '⚙️', label: 'Settings', onClick: () => router.push('/partner/operator/settings') },
    ];
    
    if (loading) return <div>Loading...</div>;
    
    return (
      <div>
        <DashboardHero profile={profile} role="TOUR_OPERATOR" />
        <StatCardGrid stats={stats} theme={theme} />
        <QuickActions actions={actions} theme={theme} />
        <RecentActivity items={tours.slice(0, 5)} type="tour" theme={theme} />
      </div>
    );
  }
  ```

- [ ] Ensure API calls work correctly
- [ ] Match hotel dashboard styling but with purple gradient
- [ ] Test with mock data

**Acceptance Criteria:**
- ✅ Operator dashboard displays tour stats
- ✅ Purple gradient applies correctly
- ✅ Quick actions navigate to tour creation
- ✅ Recent activity shows latest tours

---

### Priority 2.6: Add Role Switcher Component ⏱️ 1 hour

**Files to modify:**
- `web/src/components/partner/PartnerNav.tsx`
- `web/src/app/partner/layout.tsx`

**Tasks:**
- [ ] Add role switcher to nav
  ```tsx
  // In PartnerNav.tsx
  import { RoleSwitcher } from './RoleSwitcher';
  import { useRouter } from 'next/navigation';
  
  export function PartnerNav({ profiles }: { profiles: any[] }) {
    const router = useRouter();
    const [activeRole, setActiveRole] = useState('HOTEL_MANAGER');
    
    const handleRoleSwitch = (newRole: string) => {
      setActiveRole(newRole);
      const targetRoute = newRole === 'HOTEL_MANAGER' ? '/partner/hotel' : '/partner/operator';
      router.push(targetRoute);
    };
    
    return (
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-bold">TripAvail Partner Hub</div>
          <RoleSwitcher
            profiles={profiles}
            activeRole={activeRole}
            onSwitch={handleRoleSwitch}
          />
        </div>
      </nav>
    );
  }
  ```

- [ ] Test switching between roles
- [ ] Verify state persistence (local storage)

**Acceptance Criteria:**
- ✅ Role switcher visible when user has multiple profiles
- ✅ Switching roles updates dashboard
- ✅ Active role is highlighted

---

## ✅ AFTER PHASE 2 - CHECKPOINT

**Time Elapsed:** ~20 hours (Phase 1 + Phase 2)  
**Status:** ✅ Partner Workspace complete with both dashboards  
**What Works:**
- Hotel manager and tour operator dashboards
- Role switching (if user has both profiles)
- Gradient theming per role
- Real stats from backend
- Mobile responsive design

**Next:** Migrate existing routes and create the 4 critical flows

---

## 🔄 PHASE 3: MIGRATE EXISTING ROUTES & CREATE FLOWS (Days 4-6 - 24 hours)

### Priority 3.1: Migrate Hotel Routes ⏱️ 2 hours

**Current Structure:**
```
/host/packages
/host/properties
/host/onboarding
/host/layout.tsx
```

**New Structure:**
```
/partner/hotel/packages
/partner/hotel/properties
/partner/hotel/onboarding
```

**Tasks:**
- [ ] Move files (keeping old paths for backward compatibility during transition)
  ```bash
  # Create new structure
  mkdir -p web/src/app/partner/hotel/packages
  mkdir -p web/src/app/partner/hotel/properties
  mkdir -p web/src/app/partner/hotel/onboarding
  ```

- [ ] Copy and adapt host files
  - Copy `/host/packages/*` → `/partner/hotel/packages/*`
  - Copy `/host/properties/*` → `/partner/hotel/properties/*`
  - Copy `/host/onboarding/*` → `/partner/hotel/onboarding/*`
  - Update all internal navigation links

- [ ] Update navigation links (search & replace)
  ```
  /host/packages → /partner/hotel/packages
  /host/properties → /partner/hotel/properties
  /host/onboarding → /partner/hotel/onboarding
  ```

- [ ] Keep old `/host` routes for backward compatibility (redirect to `/partner/hotel`)
  ```tsx
  // web/src/app/host/page.tsx
  'use client';
  
  import { useRouter } from 'next/navigation';
  import { useEffect } from 'react';
  
  export default function HostRedirect() {
    const router = useRouter();
    
    useEffect(() => {
      router.replace('/partner/hotel');
    }, [router]);
    
    return null;
  }
  ```

**Acceptance Criteria:**
- ✅ All hotel routes work under `/partner/hotel/*`
- ✅ Old `/host/*` routes redirect to new paths
- ✅ No broken links or 404 errors

---

### Priority 3.2: Migrate Operator Routes ⏱️ 1 hour

**Current Structure:**
```
/operator/tours
/operator/departures
/operator/onboarding
/operator/profile
/operator/layout.tsx
```

**New Structure:**
```
/partner/operator/tours
/partner/operator/departures
/partner/operator/onboarding
/partner/operator/settings
```

**Tasks:**
- [ ] Create new operator structure
  ```bash
  mkdir -p web/src/app/partner/operator/tours
  mkdir -p web/src/app/partner/operator/departures
  mkdir -p web/src/app/partner/operator/onboarding
  mkdir -p web/src/app/partner/operator/settings
  ```

- [ ] Copy and adapt operator files
  - Copy `/operator/tours/*` → `/partner/operator/tours/*`
  - Copy `/operator/departures/*` → `/partner/operator/departures/*`
  - Copy `/operator/onboarding/*` → `/partner/operator/onboarding/*`
  - Copy `/operator/profile/*` → `/partner/operator/settings/*`

- [ ] Update all navigation links

- [ ] Create redirect routes
  ```tsx
  // web/src/app/operator/page.tsx
  export default function OperatorRedirect() {
    const router = useRouter();
    useEffect(() => {
      router.replace('/partner/operator');
    }, [router]);
    return null;
  }
  ```

**Acceptance Criteria:**
- ✅ All operator routes work under `/partner/operator/*`
- ✅ Old `/operator/*` routes redirect
- ✅ No broken links

---

### Priority 3.3: Create Hotel Listing Flow (10 Steps) ⏱️ 4 hours

**Reference:** See `hotel_listing_flow.txt` for complete flow

**Files to create:**
```
web/src/app/partner/hotel/properties/new/
├── page.tsx               # Multi-step form container
├── Step1PropertyType.tsx   # Select type
├── Step2Basics.tsx        # Name, rating, description
├── Step3Location.tsx      # Address + map
├── Step4Photos.tsx        # Upload photos
├── Step5Amenities.tsx     # Select amenities
├── Step6Services.tsx      # Add services
├── Step7Rooms.tsx         # Configure rooms
├── Step8Policies.tsx      # Policies
├── Step9Pricing.tsx       # Room pricing
├── Step10Review.tsx       # Review & submit
└── types.ts               # Form state types
```

**Form State Type:**
```typescript
interface PropertyFormState {
  step: number;
  propertyType: string;
  name: string;
  description: string;
  starRating: number;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates: { lat: number; lng: number };
  photos: string[]; // URLs after upload
  selectedAmenities: string[];
  services: Array<{ id: string; price?: number; enabled: boolean }>;
  rooms: Array<{
    type: string;
    name: string;
    size: number;
    maxGuests: number;
    available: number;
    beds: Record<string, number>;
    amenities: string[];
    price: number;
    photos: string[];
  }>;
  policies: {
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicy: string;
    houseRules: string[];
    deposit?: number;
  };
}
```

**Tasks:**
- [ ] Create multi-step form container
  ```tsx
  // web/src/app/partner/hotel/properties/new/page.tsx
  'use client';
  
  import { useState, useCallback } from 'react';
  import { PropertyFormState } from './types';
  import Step1PropertyType from './Step1PropertyType';
  import Step2Basics from './Step2Basics';
  // ... import all steps
  
  export default function CreatePropertyPage() {
    const [formState, setFormState] = useState<PropertyFormState>({
      step: 1,
      propertyType: '',
      // ... initialize other fields
    });
    
    const handleNext = useCallback(() => {
      // Validate current step
      if (validateCurrentStep(formState)) {
        setFormState(prev => ({ ...prev, step: prev.step + 1 }));
      }
    }, [formState]);
    
    const handlePrev = useCallback(() => {
      setFormState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
    }, []);
    
    const handleUpdateField = useCallback((field: string, value: any) => {
      setFormState(prev => ({ ...prev, [field]: value }));
    }, []);
    
    const handleSubmit = async () => {
      try {
        // Submit to backend
        const response = await createProperty(formState);
        // Navigate to property detail
        router.push(`/partner/hotel/properties/${response.id}`);
      } catch (err) {
        console.error('Failed to create property:', err);
      }
    };
    
    const steps = [
      <Step1PropertyType {...} />,
      <Step2Basics {...} />,
      // ... all 10 steps
    ];
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <ProgressBar current={formState.step} total={10} />
        </div>
        
        {steps[formState.step - 1]}
        
        <div className="flex gap-4 mt-8">
          {formState.step > 1 && (
            <Button label="Back" onClick={handlePrev} />
          )}
          {formState.step < 10 && (
            <Button label="Next" onClick={handleNext} variant="primary" />
          )}
          {formState.step === 10 && (
            <Button label="Create Property" onClick={handleSubmit} variant="primary" />
          )}
        </div>
      </div>
    );
  }
  ```

- [ ] Implement each step component
  - Each step validates its fields
  - Updates form state on change
  - Shows error messages

- [ ] Add photo upload (Step 4)
  ```tsx
  // Step4Photos.tsx
  export default function Step4Photos({ formState, onUpdate }: Props) {
    const handlePhotoUpload = async (file: File, category: string) => {
      // Upload to backend (signed URL)
      const response = await uploadPropertyPhoto(file, category);
      onUpdate('photos', [...formState.photos, response.url]);
    };
    
    return (
      <div>
        <h2>Upload Property Photos</h2>
        <div className="grid grid-cols-2 gap-4">
          {PHOTO_CATEGORIES.map(cat => (
            <PhotoUploadZone
              key={cat}
              category={cat}
              onUpload={handlePhotoUpload}
              required={PHOTO_MIN_REQUIREMENTS[cat]}
            />
          ))}
        </div>
      </div>
    );
  }
  ```

- [ ] Add amenities selector (Step 5)
  ```tsx
  // Step5Amenities.tsx
  export default function Step5Amenities({ formState, onUpdate }: Props) {
    const [amenities, setAmenities] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    
    useEffect(() => {
      // Fetch amenities from backend
      fetchAmenities();
    }, []);
    
    const handleAmenityToggle = (amenityId: string) => {
      onUpdate('selectedAmenities', 
        formState.selectedAmenities.includes(amenityId)
          ? formState.selectedAmenities.filter(a => a !== amenityId)
          : [...formState.selectedAmenities, amenityId]
      );
    };
    
    return (
      <div>
        <h2>Select Amenities</h2>
        <input
          type="text"
          placeholder="Search amenities..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {amenities
            .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(amenity => (
              <label key={amenity.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formState.selectedAmenities.includes(amenity.id)}
                  onChange={() => handleAmenityToggle(amenity.id)}
                />
                <span>{amenity.icon} {amenity.name}</span>
              </label>
            ))}
        </div>
      </div>
    );
  }
  ```

- [ ] Add room configuration (Step 7 - sub-flow)
  ```tsx
  // Step7Rooms.tsx
  // This is a complex step with its own sub-flow for each room type
  // Use a nested state machine for room configuration
  ```

- [ ] Add review step (Step 10)
  ```tsx
  // Step10Review.tsx
  export default function Step10Review({ formState, onSubmit }: Props) {
    return (
      <div className="space-y-6">
        <ReviewSection title="Property Type" value={formState.propertyType} />
        <ReviewSection title="Name" value={formState.name} />
        <ReviewSection title="Location" value={`${formState.address}, ${formState.city}`} />
        <ReviewSection title="Photos" value={`${formState.photos.length} photos`} />
        <ReviewSection title="Amenities" value={`${formState.selectedAmenities.length} selected`} />
        <ReviewSection title="Rooms" value={`${formState.rooms.length} room types`} />
        
        <Button
          label="Create Property"
          onClick={onSubmit}
          variant="primary"
          fullWidth
        />
      </div>
    );
  }
  ```

**Acceptance Criteria:**
- ✅ All 10 steps render without errors
- ✅ Form state persists across steps
- ✅ Back/next navigation works
- ✅ Validation prevents invalid progression
- ✅ Photos upload successfully
- ✅ Property created in backend

---

### Priority 3.4: Create Hotel Package Creation Flow (10 Steps) ⏱️ 4 hours

**Reference:** See `hotel_package_creation_flow.txt`

**Files to create:**
```
web/src/app/partner/hotel/packages/new/
├── page.tsx
├── Step1PackageType.tsx
├── Step2Basics.tsx
├── Step3Description.tsx
├── Step4Highlights.tsx
├── Step5Pricing.tsx
├── Step6Media.tsx
├── Step7Calendar.tsx
├── Step8Policies.tsx
├── Step9Exclusions.tsx
├── Step10Review.tsx
└── types.ts
```

**Key Feature: Discount Calculator (Step 5)**
```tsx
// Shows calculation:
// Base Rate: $150/night × 2 nights = $300
// + Breakfast: $30/night × 2 = $60
// + Spa Credits: $50
// + Welcome Drinks: $20
// + Room Upgrade: $40
// ──────────────────
// Total Value: $470
// Discount: 25% = -$117.50
// Final Price: $352.50
// YOU SAVE: $117.50
```

**Tasks:**
- [ ] Create multi-step form container (similar to property creation)
- [ ] Implement package type selector (Step 1)
- [ ] Implement discount calculator (Step 5) with slider
- [ ] Add media upload (Step 6)
- [ ] Add calendar picker (Step 7) for availability
- [ ] Add review step (Step 10)

**Acceptance Criteria:**
- ✅ All 10 steps work correctly
- ✅ Discount calculation is accurate
- ✅ Package created and published in backend

---

### Priority 3.5: Create Tour Package Creation Flow (7 Steps) ⏱️ 4 hours

**Reference:** See `Tour_package_cration_flow.txt`

**Files to create:**
```
web/src/app/partner/operator/tours/new/
├── page.tsx
├── Step1Basics.tsx
├── Step2Itinerary.tsx
├── Step3Pricing.tsx
├── Step4Media.tsx
├── Step5Policies.tsx
├── Step6Calendar.tsx
├── Step7Review.tsx
└── types.ts
```

**Key Feature: Day-by-Day Itinerary Builder**
```tsx
// Step2Itinerary.tsx
// Dynamic day builder:
// + Day 1 (Morning, Afternoon, Evening activities, meals, accommodation)
// + Day 2
// + Day 3
// ...
// + Add Day button
```

**Tasks:**
- [ ] Create multi-step form container
- [ ] Implement itinerary builder with dynamic days
- [ ] Implement pricing (per person, group, child pricing)
- [ ] Add media upload
- [ ] Add calendar for tour dates

**Acceptance Criteria:**
- ✅ All 7 steps work
- ✅ Itinerary days can be added/removed
- ✅ Tour created in backend

---

### Priority 3.6: Create Role Switching Endpoint ⏱️ 1 hour

**API Endpoint:** `POST /v1/users/me/switch-role`

**Frontend Implementation:**
```tsx
// web/src/lib/api-client.ts
export async function switchUserRole(providerType: 'HOTEL_MANAGER' | 'TOUR_OPERATOR') {
  return apiFetch('/v1/users/me/switch-role', {
    method: 'POST',
    body: { providerType },
  });
}
```

**UI Integration:**
```tsx
// web/src/app/components/RoleSwitcher.tsx
const handleRoleSwitch = async (role: string) => {
  try {
    await switchUserRole(role);
    // Update auth context
    await refresh();
    // Navigate to appropriate dashboard
    router.push(role === 'HOTEL_MANAGER' ? '/partner/hotel' : '/partner/operator');
  } catch (err) {
    showErrorMessage('Failed to switch role');
  }
};
```

**Tasks:**
- [ ] Add role switching to main navigation
  - Hamburger menu → "Switch to Hotel Manager"
  - Hamburger menu → "Switch to Traveler"
  - Hamburger menu → "Switch to Tour Operator" (if user has both)

- [ ] Update auth context to support active role
  ```typescript
  interface AuthContext {
    user: AuthUser;
    activeRole: 'TRAVELER' | 'HOTEL_MANAGER' | 'TOUR_OPERATOR';
    switchRole: (role: string) => Promise<void>;
  }
  ```

- [ ] Persist active role to localStorage
  ```typescript
  localStorage.setItem('activeRole', newRole);
  ```

**Acceptance Criteria:**
- ✅ Users can switch between roles
- ✅ UI updates immediately
- ✅ Role persists on page refresh
- ✅ Correct dashboard loads for each role

---

## ✅ AFTER PHASE 3 - CHECKPOINT

**Time Elapsed:** ~44 hours (all phases)  
**Status:** ✅ All core features complete  
**What Works:**
- Partner workspace with unified entry
- Hotel manager and tour operator dashboards
- All 4 creation flows (property listing, package, tour)
- Role switching
- Mobile-responsive design
- Backend integration

---

## 📋 COMPREHENSIVE SUMMARY

### Total Tasks: 52
### Estimated Time: 44-48 hours
### Timeline: 8-10 business days (with breaks, testing, fixes)

### Breakdown:
| Phase | Tasks | Hours | Days |
|-------|-------|-------|------|
| **1: UI Polish** | 5 | 4 | 1 |
| **2: Partner Workspace** | 6 | 16 | 2 |
| **3: Routes & Flows** | 6 | 24 | 3 |
| **Testing & Fixes** | - | 4 | 1 |
| **Deployment** | - | 2 | 1 |
| **TOTAL** | **17** | **50** | **8-10** |

---

## 🎯 SUCCESS CRITERIA

### By End of Week:

**Backend:**
- ✅ OTP login working
- ✅ Provider onboarding complete
- ✅ Hotel/tour package creation
- ✅ Mock bookings (no real payments)
- ✅ Admin panel functional

**Frontend:**
- ✅ Mobile responsive (all pages)
- ✅ Loading states with skeletons
- ✅ Empty states with CTAs
- ✅ Unified partner workspace
- ✅ Hotel manager dashboard
- ✅ Tour operator dashboard
- ✅ Role switching
- ✅ All 4 creation flows
- ✅ Semantic HTML/accessibility

**User Experience:**
- ✅ Traveler can browse packages
- ✅ Traveler can book packages (mock)
- ✅ Hotel manager can list properties
- ✅ Hotel manager can create packages
- ✅ Tour operator can create tours
- ✅ All partners can switch roles
- ✅ Admin can approve providers

---

## ⚠️ Known Constraints

1. **No Real Payments** - Using mock Stripe
2. **No Advanced Search** - Basic search only
3. **No Reviews** - Not implemented
4. **No Messaging** - Not implemented
5. **No Email Notifications** - Manual testing only

---

## 📅 NEXT STEPS

1. **TODAY:** Complete Phase 1 (UI polish) - 4 hours
2. **Tomorrow-Day 3:** Complete Phase 2 (Partner Workspace) - 16 hours
3. **Day 4-6:** Complete Phase 3 (Routes & Flows) - 24 hours
4. **Day 7:** Testing, bug fixes, polish
5. **Day 8:** Deploy to production

---

**Ready to start?** Which task should we begin with?
