# WEEK 4: Provider Onboarding (Hotels)

**Dates:** Jan 13-17, 2026  
**Status:** Completed ✅  
**Critical Path:** YES (foundation for packages)

---

## 📌 Week Overview

**Goal:** Implement the hotel provider onboarding flow so property data becomes the single source of truth for future hotel packages.

---

## ✅ Implemented In Repo

- **Prisma models** for hotels: `ProviderProfile`, `ProviderOnboarding`, `Listing`, `Room`, `InventoryNight`, `Amenity`, `ListingAmenity`
- **Hotel onboarding API**: start + hotel steps 2–7
- **Step enforcement**: steps cannot be skipped; progression tracked via `ProviderOnboarding.completedSteps`
- **Persistence**: step payloads stored in `ProviderOnboarding.onboardingData`
- **Step 7**: creates `Listing` + `Room` rows and joins amenities via `ListingAmenity`
- **E2E verification**: hotel onboarding suite + seeded listings suite are green

**Key files:**

- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- [backend/src/provider_onboarding/provider_onboarding.controller.ts](backend/src/provider_onboarding/provider_onboarding.controller.ts)
- [backend/src/provider_onboarding/provider_onboarding.service.ts](backend/src/provider_onboarding/provider_onboarding.service.ts)
- [backend/src/provider_onboarding/dto](backend/src/provider_onboarding/dto)
- [backend/test/hotel-onboarding.e2e.spec.ts](backend/test/hotel-onboarding.e2e.spec.ts)
- [backend/test/listings.e2e.spec.ts](backend/test/listings.e2e.spec.ts)
- [backend/test/global-setup.ts](backend/test/global-setup.ts)
- [backend/test/jest-e2e.json](backend/test/jest-e2e.json)

**Run:** `cd backend && pnpm test:e2e`

---

## 🧭 Planned / Not Implemented In This Slice

- Media uploads via signed URLs
- Inventory-night generation/management endpoints (beyond seed)
- Publishing gates tied to provider verification and property approval

---

## 🎯 Success Criteria

✅ Hotel onboarding flow (start + steps 2–7) works end-to-end  
✅ Cannot skip steps (validation enforced)  
✅ Step payloads persisted in `ProviderOnboarding.onboardingData`  
✅ Step 7 creates Listing + Rooms + ListingAmenities  
✅ Backend E2E tests passing (`pnpm test:e2e`)  
⬜ Media upload (signed URLs)  
⬜ Inventory-night generation/management endpoints  
⬜ Verification gates for publishing

**Unblocks:** Week 5 (Hotel Packages)

---

**Last Updated:** 26 Dec 2025
