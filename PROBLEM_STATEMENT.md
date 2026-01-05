# Problem Statement: Next.js Layout Routing Issue

## Environment
- **Framework:** Next.js 16.1.1 (App Router)
- **Frontend:** React 19.2.3, TypeScript, running in Docker on port 4000
- **Backend:** NestJS on port 4100
- **Auth:** Working perfectly - JWT mock tokens, `/v1/auth/me` returns 200 with user data

## Problem
Cannot access the onboarding page at `/host/onboarding` - getting 404 despite the page file existing.

## File Structure
```
web/src/app/
├── layout.tsx (root layout with AuthProvider)
├── host/
│   ├── layout.tsx (host layout - previously had a guard checking for hotelProfile)
│   └── onboarding/
│       └── page.tsx (onboarding wizard - 7 steps)
```

## What We Tried

### 1. Initial Issue
`/host/layout.tsx` was blocking access with this code:
```tsx
if (!hotelProfile) {
  return (
    <div>
      <h1>Become a hotel partner</h1>
      <Link href="/host/onboarding">Start onboarding</Link>
    </div>
  );
}
```

When user clicked "Start onboarding", nothing happened because they were already on `/host/onboarding` - the layout hijacked the page and rendered the fallback UI instead of the page content.

### 2. Attempted Fixes
- Added `usePathname()` check to bypass guard if path is `/host/onboarding`
- Added `useSelectedLayoutSegments()` to detect onboarding segment
- Moved bypass check to top of layout (early return)
- Simplified host layout to always render children if no profile
- Created `/host/onboarding/layout.tsx` to override parent layout
- Deleted `/host/onboarding/layout.tsx` (caused 404)
- Cleared `.next` cache multiple times
- Restarted Docker containers multiple times

### 3. Current State
- URL: `http://localhost:4000/host/onboarding`
- Response: 200 OK
- HTML Response: Contains React Server Components markup with 404 content
- Browser shows: Empty page or "Become a hotel partner" card (cached)
- Console logs: No `[HostOnboarding]` logs appear (page not rendering)

## Current Host Layout Code
```tsx
'use client';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const hotelProfile = useMemo(
    () => user?.profiles?.find((p) => p.providerType === 'HOTEL_MANAGER') || null,
    [user],
  );

  if (loading) return <div>Loading session...</div>;

  // Temporarily disable gate - render children for all routes
  if (!hotelProfile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header>Host Dashboard</header>
      <main>{children}</main>
    </div>
  );
}
```

## Expected Behavior
1. User logs in at `/auth/login` ✅ (working)
2. User navigates to `/host/onboarding` ❌ (broken)
3. Should see onboarding wizard with:
   - Progress stepper (7 steps)
   - "Welcome to Hotel Onboarding" card
   - "Start Onboarding" button
4. Click "Start Onboarding" → POST to `/v1/provider-onboarding/start` → create provider profile

## Actual Behavior
- URL loads but page shows 404 or cached "Become a hotel partner" card
- Page component never mounts (no console logs)
- Next.js serving 404 markup despite file existing at `/host/onboarding/page.tsx`

## Debug Info

### Network Tab
```
GET /host/onboarding → 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: no-store, must-revalidate
```

### Response Body
HTML contains React Server Components chunks with this in RSC payload:
```
"notFound":["$","$L7","c-not-found",{"type":"not-found","pagePath":"__next_builtin__not-found.js","children":["$21",[]]}
```

### Console Logs
- No `[HostOnboarding]` logs (page.tsx has `console.log('[HostOnboarding] ...')` at top)
- Only React DevTools warnings
- No errors

## Questions for Expert

1. **Why is Next.js serving 404 content when the page file exists?**
   - `/host/onboarding/page.tsx` exists and exports a default component
   - Route should match pattern `/host/[segment]/page.tsx`

2. **Does having a layout at `/host/layout.tsx` prevent child routes from loading?**
   - Should the parent layout render `{children}` for all paths to work?
   - Is there a Next.js App Router pattern we're missing?

3. **Is there a build cache issue Docker isn't clearing?**
   - Tried `rm -rf .next` multiple times
   - Restarted containers
   - Still serves old/cached responses

4. **Should we use a different routing pattern?**
   - Parallel routes?
   - Route groups?
   - Different folder structure?

## Desired End State
Clean onboarding flow:
1. Login → Home page
2. Click "Become a Host" → `/host/onboarding`
3. See onboarding wizard (not blocked by layout)
4. Complete 7 steps to create provider profile
5. Redirect to host dashboard

## Request
Please help identify:
- Why Next.js is routing to 404 instead of the page
- How to properly structure layouts so child routes work
- Best practice for "gated" dashboards in Next.js App Router where some routes (like onboarding) should bypass the gate
