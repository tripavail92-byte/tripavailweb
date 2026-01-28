# Role-Based Architecture & Gap Analysis

**Date:** January 28, 2026
**Reference:** "Mawais TripAvail" (Figma/Vite Prototype) vs. Current Next.js/NestJS Implementation

---

## 🏛️ Architecture Mismatch (Cross-Role)

The fundamental gap is **Architectural Philosophy**:
*   **The Bible (Ideal):** Designed as a **"Stateful Application"**. It assumes rich interaction, persistent client-side state (User Context, Wishlists, Notifications), and transitions that mimic a mobile app (3D Flips, Drawers, Overlays).
*   **The Reality (Current):** Built as a **"Transactional Website"**. It relies on server-side rendering (SSR), page navigations, and simple CRUD forms.

**Missing Shared Infrastructure:**
1.  **Notification System:** Bible relies on real-time alerts (bell icon). *Backend: Missing.*
2.  **Messaging Mesh:** Bible assumes seamless chat between Role A and Role B. *Backend: Missing.*
3.  **Global Search Overlay:** Bible specifies a blur-overlay reachable from anywhere. *Frontend: Missing.*

---

## 1. 👤 The Traveler Role

**Objective:** Discovery, Engagement, Booking Management.
**Status:** 🔴 **CRITICAL GAP** (The "Soul" of the app is missing).

| Feature | The "Bible" Specification | Current Architecture | Gap Analysis |
| :--- | :--- | :--- | :--- |
| **Dashboard** | **Personalized Hub**: "Good Morning Maria", Weather widget, Animated stats (Trips, Countries), Upcoming Trip countdown. | **None**. Users land on a generic Search Home page. | Backend has `BookingsModule` to feed data, but no `DashboardService` to aggregate stats. Frontend completely missing. |
| **Wishlists** | **Core Engagement**: Save Hotels/Tours, Price Alerts, "Dream Destinations". | **None**. | **Zero Implementation**. Needs `WishlistModule` (NestJS) + dedicated UI page. |
| **Trips** | **Interactive Timeline**: Tabbed view (Upcoming/Past), visuals of destinations, "Download Receipt" actions. | **Basic List**. Simple table or list of bookings. | Data exists, but the *Visual Experience* (Cards, Status Badges) is missing. |
| **Search** | **Smart Search**: Filter by "Vibe" (Romantic, Adventure), Map View integration. | **Basic Search**. Text-based input. | Meilisearch is set up (backend), but Frontend lacks filter logic/UI. |
| **Profile** | **Gamified**: Progress bars for "Explorer Level", "Reviews Written". | **Basic**: Edit Profile form. | No gamification logic in backend. |

**Action Item:** The Traveler experience is currently "Guest Checkout" style. It needs to become a "User Account" style app. **Priority 1: Build User Dashboard & Wishlists.**

---

## 2. 🏨 The Hotel Manager Role

**Objective:** Asset Management, Package Creation, Yield Management.
**Status:** 🟠 **MODERATE GAP** (Backend logic is strong, UX is weak).

| Feature | The "Bible" Specification | Current Architecture | Gap Analysis |
| :--- | :--- | :--- | :--- |
| **Onboarding** | **10-Step Wizard**: Highly visual, segmented flow (Basics -> Media -> Pricing -> etc). Progress bars, "Save & Exit". | **7-Step Flow**: `ProviderOnboardingModule` supports the data structure. | Backend matches well! Frontend needs the specific "10-Step" UI components (visual stepper, drag-drop media). |
| **Package Creation** | **Template System**: "Choose Type" (Romantic, Family, Business) -> Pre-fills amenities & tags. | **Standard Form**: Generic form fields. | **UX Gap**. The "Template" logic (auto-filling fields based on type) is missing in frontend. |
| **Pricing** | **Strategic**: Seasonal Pricing editors, Occupancy grids, Competitor Analysis widget. | **Basic**: `PricingService` exists but is likely simple. | Missing visual "Season Editor" and "Competitor" mock data. |
| **Assets** | **Media Manager**: Drag & Drop gallery, "Hero Image" selection. | **File Upload**: Basic single-file uploaders. | Need a robust Media Manager component (Frontend). |

**Action Item:** The backend is actually 80% there (`ProviderOnboarding` and `HotelPackages` modules). The work is entirely **Frontend Polish**: Implementing the "Wizard" UX pattern instead of long scrolling forms.

---

## 3. 🎒 The Tour Operator Role

**Objective:** Itinerary Building, Group Logistics.
**Status:** 🟠 **MODERATE GAP**.

| Feature | The "Bible" Specification | Current Architecture | Gap Analysis |
| :--- | :--- | :--- | :--- |
| **Tour Builder** | **Itinerary Builder**: Drag & Drop activities into "Day 1", "Day 2" slots. | **Form Based**: Likely a nested list form. | **Complex UI Missing**. The "Drag & Drop" interaction is a significant frontend build. |
| **Groups** | **Manifest Management**: View passenger lists, assign guides, "Check-in" travelers. | **Basic Booking List**. | Backend has `Bookings`, but no specific "Group/Manifest" view. |
| **Guides** | **Staff Management**: Assign specific guides to specific tour dates. | **None**. | No `Staff` or `Guide` entity in backend yet. |

**Action Item:** Requires a specialized **"Itinerary Builder"** component on the frontend (Day-based vertical timeline).

---

## 4. 🎭 Role Switching (The "Signature" Feature)

**The Bible Spec:**
> "Seamless transitions with 3D flip animation and state preservation."

*   **Behavior:** When Maria (Traveler) switches to Maria (Host), the entire app screen **FLIPS** 180 degrees (like a card) to reveal the dark-mode "Host Dashboard".
*   **Technique:** Requires `CSS 3D Transforms` and a global Layout Wrapper that holds BOTH apps in memory (or simulates it).

**Current Reality:**
*   **Behavior:** Clicking "Switch to Host" triggers a standard route change (`/traveler` -> `/host`). The screen blinks/reloads.

**Verdict:**
This is the "Wow" factor. Implementing this requires installing `framer-motion` (or `motion/react`) and wrapping the main `layout.tsx` in a 3D context.

---

## 🏁 Summary & Roadmap

1.  **Backend (Immediate Functionality Gaps):**
    *   Create **`WishlistModule`** (Traveler).
    *   Create **`ReviewModule`** (Shared).
    *   Create **`NotificationModule`** (Shared).

2.  **Frontend (Experience Gaps):**
    *   **Traveler:** Build the **Dashboard** (it's the home screen for logged-in users).
    *   **Host:** Refactor the "Add Package" form into the **10-Step Wizard** (Components: `WizardStepper`, `MediaUploader`, `PricingGrid`).
    *   **Core:** Implement the **3D Flip Layout** for role switching.

3.  **Tour Operator:**
    *   Can wait until Host/Traveler are polished.
