# TripAvail Onboarding Flow - How It Should Work

## Authentication States

### 1. NOT LOGGED IN
- **URL:** Any page
- **What shows:** Public content only
- **Action:** User sees "Login" button/link
- **Redirect:** Clicking login → `/auth/login`

### 2. LOGGED IN - No Provider Profile
- **URL:** Any page (including `/host/onboarding`)
- **User info:** Has `accessToken`, has `user` object from `/v1/auth/me`
- **User type:** Regular user (TRAVELER or ADMIN role)
- **What should show:** 
  - ✅ User name/email in header
  - ✅ "Logout" button
  - ✅ If on `/host/onboarding`: Show onboarding wizard starting at Step 1
- **Action:** User can start onboarding process

### 3. LOGGED IN - Has Provider Profile (Onboarding In Progress)
- **URL:** `/host/onboarding`
- **User info:** Has `accessToken`, has `user` object, has `user.profiles` array with HOTEL_MANAGER profile
- **Profile status:** `onboardingStatus.currentStep` < 7
- **What should show:**
  - ✅ User name/email in header
  - ✅ Progress indicator showing completed steps
  - ✅ Current step form
  - ✅ "Save & Continue" button
- **Action:** User continues from their last saved step

### 4. LOGGED IN - Has Completed Provider Profile
- **URL:** `/host/onboarding`
- **User info:** Has everything from state #3
- **Profile status:** `onboardingStatus.currentStep` === 7, `onboardingStatus.isComplete` === true
- **What should show:**
  - ✅ Redirect to `/host/dashboard` automatically
  - OR: Show "Onboarding complete! Go to dashboard" message

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    VISIT /host/onboarding                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │ Check Auth     │
                    │ (AuthProvider) │
                    └───────┬────────┘
                            │
            ┌───────────────┼───────────────┐
            │                               │
    ┌───────▼────────┐              ┌──────▼──────┐
    │ NO TOKEN       │              │ HAS TOKEN   │
    └───────┬────────┘              └──────┬──────┘
            │                               │
            │                        ┌──────▼──────────┐
            │                        │ GET /v1/auth/me │
            │                        └──────┬──────────┘
            │                               │
            │               ┌───────────────┼───────────────┐
            │               │                               │
            │        ┌──────▼──────┐              ┌────────▼────────┐
            │        │   200 OK    │              │   401 Error     │
            │        └──────┬──────┘              └────────┬────────┘
            │               │                               │
    ┌───────▼───────────────▼─────┐                        │
    │ Redirect to /auth/login     │◄───────────────────────┘
    └───────────────┬───────────────┘
                    │
            ┌───────▼────────┐
            │ Login Page     │
            │ Enter email    │
            │ Enter OTP code │
            └───────┬────────┘
                    │
            ┌───────▼────────────────┐
            │ POST /v1/auth/verify   │
            │ Returns: accessToken   │
            └───────┬────────────────┘
                    │
            ┌───────▼────────────────┐
            │ Store token in         │
            │ localStorage           │
            │ Redirect to /          │
            └───────┬────────────────┘
                    │
        ┌───────────▼───────────────┐
        │ User navigates back to    │
        │ /host/onboarding manually │
        └───────────┬───────────────┘
                    │
        ┌───────────▼────────────────────┐
        │ Check user.profiles array      │
        └───────────┬────────────────────┘
                    │
        ┌───────────┼───────────────┐
        │                           │
┌───────▼──────────┐      ┌─────────▼──────────┐
│ NO HOTEL PROFILE │      │ HAS HOTEL PROFILE  │
└───────┬──────────┘      └─────────┬──────────┘
        │                           │
        │                   ┌───────▼────────────────────┐
        │                   │ GET /v1/provider-onboarding│
        │                   │     /status/:providerId    │
        │                   └───────┬────────────────────┘
        │                           │
        │                   ┌───────▼─────────────────────┐
        │                   │ Show step wizard            │
        │                   │ currentStep from backend    │
        │                   │ Pre-fill saved data         │
        │                   └─────────────────────────────┘
        │
┌───────▼────────────────────────────────────┐
│ SHOW STEP 1: Welcome Screen                │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ "Welcome to Hotel Onboarding"       │   │
│ │                                     │   │
│ │ [Start Onboarding] ← BUTTON        │   │
│ │                                     │   │
│ │ onClick: POST /v1/provider-         │   │
│ │          onboarding/start           │   │
│ │          { providerType:            │   │
│ │            "HOTEL_MANAGER" }        │   │
│ └─────────────────────────────────────┘   │
└────────────────────────────────────────────┘
                    │
            ┌───────▼───────────────────┐
            │ Backend creates:          │
            │ 1. ProviderProfile        │
            │ 2. ProviderOnboarding     │
            │ Returns: { profile: {...} }│
            └───────┬───────────────────┘
                    │
            ┌───────▼───────────────────┐
            │ Frontend stores providerId│
            │ Shows Step 2: Basics form │
            └───────────────────────────┘
```

---

## Current State Analysis

### What's Working ✅
1. **Login flow**: User can login with email + OTP code
2. **Token storage**: `mock-access-<userId>` stored in localStorage
3. **Auth guard**: Backend accepts mock tokens and returns 200 for `/v1/auth/me`
4. **Admin user exists**: `admin@tripavail.com` with ID `cmk03z3zx000648p26p4gu5id`

### What's Broken ❌

#### Issue #1: Layout Hijacking the Onboarding Page
**Location:** `web/src/app/host/layout.tsx`

**Problem:**
```tsx
// In /host/layout.tsx
if (!hotelProfile) {
  return (
    <div>
      <h1>Become a hotel partner</h1>
      <Link href="/host/onboarding">Start onboarding</Link>
      {/* ↑ This link does nothing because user is ALREADY on /host/onboarding! */}
    </div>
  );
}
```

**What happens:**
1. User navigates to `/host/onboarding`
2. Layout checks: "Does user have hotelProfile?"
3. Answer: No
4. Layout renders: "Start onboarding" link pointing to `/host/onboarding`
5. User clicks link → Nothing happens (already on that page)
6. **The actual onboarding page content is never rendered!**

**Fix Applied:** Created `/host/onboarding/layout.tsx` to bypass parent layout

---

#### Issue #2: Missing User Info Display
**Problem:** User can't see if they're logged in

**Expected:** 
```
┌─────────────────────────────────────────┐
│ Host Onboarding    👤 admin@tripavail.com [Logout] │
└─────────────────────────────────────────┘
```

**Current:**
```
┌─────────────────────────────────────────┐
│ Host Onboarding                          │
└─────────────────────────────────────────┘
```

**Needs:** Header component showing user email and logout button

---

#### Issue #3: No Auth Redirect
**Problem:** Unauthenticated users can access `/host/onboarding`

**Expected:** 
- User visits `/host/onboarding` without token
- Redirect to `/auth/login?redirect=/host/onboarding`
- After login, redirect back to `/host/onboarding`

**Current:** Page just loads (though it won't work without auth)

---

## Recommended Fixes (Priority Order)

### 1. **IMMEDIATE: Make onboarding page visible** ✅ DONE
- Created separate layout for `/host/onboarding`
- Bypasses parent layout check

### 2. **HIGH: Add user info to header**
```tsx
// In onboarding/layout.tsx
export default function OnboardingLayout({ children }) {
  const { user } = useAuth();
  
  return (
    <header>
      <div>Host Onboarding</div>
      {user && (
        <div>
          👤 {user.email}
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </header>
  );
}
```

### 3. **HIGH: Add auth protection**
```tsx
// In onboarding/page.tsx
export default function HostOnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/host/onboarding');
    }
  }, [user, loading, router]);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return null; // Will redirect
  
  // ... rest of component
}
```

### 4. **MEDIUM: Fix step initialization**
Current issue: Page defaults to `currentViewStep = 2` (skips Step 1 welcome screen)

Should be: `currentViewStep = 1` initially

### 5. **LOW: Add loading states**
- Show spinner during API calls
- Disable buttons during submission
- Show success/error messages prominently

---

## Testing Checklist

- [ ] User not logged in → Redirects to login
- [ ] User logs in → Can see their email in header
- [ ] User on onboarding page → Sees Step 1 welcome
- [ ] User clicks "Start Onboarding" → Backend creates profile
- [ ] User refreshes page → Resumes at current step
- [ ] User completes all steps → Redirects to dashboard

---

## Next Steps

Would you like me to:
1. ✅ Fix the user display in header (show email + logout)
2. ✅ Add auth protection redirect
3. ✅ Fix step initialization to start at Step 1
4. ✅ Test the complete flow end-to-end

Let me know and I'll implement these fixes systematically!
