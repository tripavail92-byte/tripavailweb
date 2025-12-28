# Frontend Wiring Milestone

**Status:** Not Started  
**Depends On:** Backend foundation (Week 4-7 complete)  
**Target:** Post-MVP Phase 1

---

## Overview

Implement **separate dashboards** for Traveler, Hotel Manager, and Tour Operator roles with Airbnb-style "Switch mode" navigation. Backend authorization is based on **provider profile existence + verification status**, not `user.role`.

---

## Architecture Requirements

### 1. User Identity Model (Backend ✅)

- User role is **always TRAVELER** (`@default(TRAVELER)`)
- "Become a Partner" creates **ProviderProfile** records (hotel manager, tour operator)
- One user can have **multiple provider profiles** via `@@unique([userId, providerType])`
- Authorization checks: `provider.verificationStatus === 'APPROVED'`

### 2. Auth Endpoint (Backend ✅ Enhanced)

**GET /v1/auth/me** returns:

```typescript
{
  id: string;
  email: string;
  phone: string;
  role: 'TRAVELER';
  profiles: [
    {
      id: string;
      providerType: 'HOTEL_MANAGER' | 'TOUR_OPERATOR';
      businessName: string;
      verificationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
      onboarding: {
        currentStep: number;
        completedSteps: { steps: number[] };
      };
    }
  ];
}
```

### 3. Frontend Route Groups (Pending)

```
web/src/app/
  ├── (traveler)/                 # Public-facing marketplace
  │   ├── layout.tsx              # Traveler nav (Browse, Trips, Profile)
  │   ├── page.tsx                # Home: search stays/packages
  │   ├── stays/[id]/
  │   ├── hotel-packages/[id]/
  │   ├── tours/[id]/
  │   ├── bookings/
  │   │   ├── [id]/               # Booking detail
  │   │   └── page.tsx            # My trips
  │   └── profile/
  │
  ├── (host)/                     # Hotel Manager dashboard
  │   ├── layout.tsx              # Host nav (Properties, Packages, Bookings, Analytics)
  │   ├── page.tsx                # Dashboard overview
  │   ├── onboarding/             # 7-step hotel onboarding
  │   ├── properties/
  │   │   ├── page.tsx            # List properties
  │   │   ├── [id]/edit/          # Edit property
  │   │   └── new/                # Create property (7 steps)
  │   ├── packages/
  │   │   ├── page.tsx            # List hotel packages
  │   │   ├── [id]/edit/
  │   │   └── new/                # 10-step package creation
  │   ├── bookings/
  │   └── analytics/
  │
  ├── (operator)/                 # Tour Operator dashboard
  │   ├── layout.tsx              # Operator nav (Tours, Departures, Bookings, Analytics)
  │   ├── page.tsx                # Dashboard overview
  │   ├── onboarding/             # 14-step tour operator onboarding
  │   ├── tours/
  │   │   ├── page.tsx            # List tour packages
  │   │   ├── [id]/edit/          # Edit tour (steps 1-7)
  │   │   └── new/                # Create tour (14 steps)
  │   ├── departures/             # Manage tour dates
  │   ├── bookings/
  │   └── analytics/
  │
  └── components/
      ├── DashboardSwitcher.tsx   # Airbnb-style mode switcher
      └── VerificationBanner.tsx  # Show verification status
```

---

## Component: Dashboard Switcher

**Location:** Navbar (visible when `user.profiles.length > 0`)

```tsx
// web/src/app/components/DashboardSwitcher.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';

export function DashboardSwitcher() {
  const { user } = useAuth(); // from GET /v1/auth/me
  const pathname = usePathname();
  const router = useRouter();

  if (!user?.profiles?.length) return null;

  const currentMode = pathname.startsWith('/host')
    ? 'host'
    : pathname.startsWith('/operator')
      ? 'operator'
      : 'traveler';

  const modes = [
    { key: 'traveler', label: 'Browse Travel', path: '/' },
    ...(user.profiles.some((p) => p.providerType === 'HOTEL_MANAGER')
      ? [{ key: 'host', label: 'Host Dashboard', path: '/host' }]
      : []),
    ...(user.profiles.some((p) => p.providerType === 'TOUR_OPERATOR')
      ? [{ key: 'operator', label: 'Operator Dashboard', path: '/operator' }]
      : []),
  ];

  return (
    <div className="flex items-center gap-2">
      {modes.map((mode) => (
        <button
          key={mode.key}
          onClick={() => router.push(mode.path)}
          className={currentMode === mode.key ? 'active' : ''}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
```

---

## Layout Guards

Each layout enforces authorization:

```tsx
// web/src/app/(host)/layout.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import { VerificationBanner } from '@/components/VerificationBanner';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  const hotelProfile = user?.profiles?.find((p) => p.providerType === 'HOTEL_MANAGER');

  if (!hotelProfile) {
    redirect('/become-a-partner'); // Start provider onboarding
  }

  return (
    <div className="host-layout">
      <HostNav />
      {hotelProfile.verificationStatus !== 'APPROVED' && (
        <VerificationBanner profile={hotelProfile} />
      )}
      <main>{children}</main>
    </div>
  );
}
```

---

## Implementation Checklist

### Phase 1: Auth + Routing

- [x] Backend: Enhance `GET /v1/auth/me` to include provider profiles
- [x] Frontend: Create `useAuth` hook that calls `/v1/auth/me`
- [x] Frontend: Set up route groups `(traveler)`, `(host)`, `(operator)`
- [x] Frontend: Create layout guards for each group
- [x] Frontend: Implement `DashboardSwitcher` component

### Phase 2: Host Dashboard

- [ ] Onboarding flow (7 steps for hotel property)
- [ ] Properties CRUD (7 steps: Welcome → Basics → Location → Rooms → Amenities → Policies → Review)
- [ ] Hotel Packages CRUD (10 steps: Type → Basics → Media → Highlights → Inclusions → Exclusions → Pricing → Calendar → Policy → Confirmation)
- [ ] Bookings list + detail
- [ ] Verification banner + status indicator

### Phase 3: Operator Dashboard

- [ ] Onboarding flow (14 steps for tour operator)
- [ ] Tours CRUD (14 steps: same as onboarding)
- [ ] Departures management
- [ ] Bookings list + detail

### Phase 4: Traveler Dashboard

- [ ] Search + browse (stays, hotel packages, tours)
- [ ] Booking flow (quote → hold → payment → confirmation)
- [ ] My trips (upcoming, past, cancelled)
- [ ] Reviews

---

## Notes

- **Authorization:** Based on `provider.verificationStatus`, NOT `user.role`
- **Publishing gate:** Only `APPROVED` providers can publish (enforced by `VerifiedProviderGuard`)
- **Onboarding:** Providers can create drafts before verification; publish is blocked until approved
- **Airbnb pattern:** User can switch dashboards without logging out
- **Mobile-first:** All flows optimized for smartphone with swipe navigation

---

_Last updated: 26 Dec 2025_
