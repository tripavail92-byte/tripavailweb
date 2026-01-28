# Frontend Implementation Plan: The "Bible" Migration

**Goal:** Upgrade the current Next.js `web` application to match the high-fidelity "Bible" prototype in terms of UX, Features, and Architecture.

## 📦 Prerequisites & Dependencies

First, we must enable the visual capabilities of the Bible (Animations, Icons, State).

1.  **Install Animation Library**: `framer-motion` (or `motion/react` as per Bible).
    *   *Why:* Essential for the "3D Flip" role switch and page transitions.
2.  **Icons**: Ensure `lucide-react` is fully available (already seems used).
3.  **State Management**: `zustand` (for persistent Wishlists/User Context without prop drilling).

```bash
npm install framer-motion zustand clsx tailwind-merge
```

---

## 🗺️ Phase 1: Routing & Structure Compliance

Refactor `web/src/app` to match the Bible's Sitemap.

### 1.1 Traveler Routes (`/traveler`)
| Route | Status | Action Required |
| :--- | :--- | :--- |
| `/dashboard` | ⚠️ **Mock** | Connect to `BookingsModule`. Add "Greeting" & "Weather" widgets. |
| `/hotels` | ❌ **Missing** | Create `page.tsx`. Implement "Hotel List" with Filters. |
| `/tours` | ❌ **Missing** | Create `page.tsx`. Implement "Tour List". |
| `/wishlist` | ❌ **Missing** | Create `page.tsx`. Needs `WishlistStore` (Local Storage first). |
| `/messages` | ❌ **Missing** | Create stub `page.tsx` (Out of scope for Day 1, but needed for nav). |
| `/profile` | ❌ **Missing** | Create `page.tsx`. Move "Edit Profile" logic here. |
| `/trips` | ⚠️ **Partial** | Enhance `bookings/page.tsx` with "Upcoming/Past" tabs. |

### 1.2 Host Routes (`/host`)
| Route | Status | Action Required |
| :--- | :--- | :--- |
| `/dashboard` | ✅ **Exists** | Polish UI. |
| `/packages/create` | ❌ **Exits as Form** | **Refactor to 10-Step Wizard**. Critical Task. |
| `/calendar` | ❌ **Missing** | Create `page.tsx`. |

### 1.3 The "Role Switcher"
*   **Bible Spec:** 3D Flip Animation.
*   **Implementation:** Wrap `app/layout.tsx` or `template.tsx` with a `<RoleFlipper>` component that uses `framer-motion` to rotate the viewport when `userRole` changes.

---

## 🛠️ Phase 2: Core Component Migration

We will port these specific components from `demofrontend/src/components` to `web/src/components`.

### 2.1 The "Engagement Layer" (Traveler)
1.  **`QuickActionGrid`**: The 4-button grid on Dashboard (Plan Trip, Find Hotels, etc).
2.  **`StatCard`**: The animated cards (Trips, Countries).
3.  **`WishlistButton`**: A reusable heart icon that toggles state in `WishlistStore`.

### 2.2 The "Wizard Engine" (Host)
1.  **`WizardStepper`**: A progress bar component (Step 1 of 10).
2.  **`StepLayout`**: A wrapper for each step (Header, Content, Footer with Back/Next).
3.  **`PackageTypeSelector`**: visual cards for "Romantic", "Adventure" selection.

---

## 📊 Phase 3: State Management Strategy

The Bible relies on "Client State" that feels persistent.

1.  **Create `store/useUserStore.ts`**:
    *   Holds `currentUser`, `currentRole`, `preferences`.
    *   Persist to `localStorage`.

2.  **Create `store/useWishlistStore.ts`**:
    *   Holds `savedItems[]`.
    *   Actions: `addItem`, `removeItem`, `checkIsSaved`.

---

## 📝 Execution Checklist

- [ ] **Step 1:** Install `framer-motion` and `zustand`.
- [ ] **Step 2:** Create the "Missing Routes" stubs (`/traveler/wishlist`, `/traveler/hotels`, `/host/calendar`).
- [ ] **Step 3:** Implement `useWishlistStore`.
- [ ] **Step 4:** Build the **Traveler Dashboard** (Real Polish).
    - [ ] Port `QuickStats`
    - [ ] Port `RecentActivity`
- [ ] **Step 5:** Build the **Host 10-Step Wizard** foundation.
    - [ ] Create `components/wizard` directory.
    - [ ] Implement `WizardStepper`.
    - [ ] Implement `PackageTypeStep` (Step 1).
    - [ ] Implement `BasicsStep` (Step 2).
    - [ ] Implement `PricingStep` (Step 7).
    - [ ] Wire up `usePackageCreationStore`.

---

## �‍♂️ Phase 3: Host Wizard Implementation

**Goal:** Replace the basic package form with a high-conversion 10-step wizard.

### 3.1 Store Architecture
Create `store/usePackageCreationStore.ts` to manage the complex multi-step state.
- **State**: `currentStep`, `totalSteps`, `formData` (nested object).
- **Actions**: `nextStep`, `prevStep`, `updateFormData`, `validateStep`.

### 3.2 Component Architecture (`src/components/wizard`)
| Component | Purpose |
| :--- | :--- |
| `WizardLayout` | Wrapper with Stepper Header and Navigation Footer (Back/Next). |
| `WizardStepper` | Visual progress bar with step icons. |
| `PackageTypeStep` | Grid of cards (Romantic, Adventure, etc.) with icons. |
| `BasicsStep` | Form for Name, Description, Duration. |
| `PricingStep` | Complex pricing inputs (Base, Seasonal, Occupancy). |

### 3.3 Route Implementation
- **Target:** `src/app/host/packages/create/page.tsx`
- **Action:** Create this new route. Wrap it in `WizardLayout`.

## 📝 Execution Checklist (Updated)


### Automated Tests
- **Unit Tests**: Verify `useWishlistStore` adds/removes items correctly.
- **Component Tests**: Ensure `WizardStepper` renders correct step based on props.

### Manual Verification
- **Role Switch**: Click "Switch to Host" -> Verify 3D Flip animation (or smooth transition).
- **Wishlist**: Click "Heart" on a hotel -> Go to `/wishlist` -> Verify item appears.
- **Wizard**: Complete all 10 steps of package creation -> Verify data payload.
