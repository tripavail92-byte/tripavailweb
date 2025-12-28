# WEEK 5: Hotel Packages

**Dates:** Jan 20-24, 2026  
**Status:** Complete for MVP (core CRUD + lifecycle + E2E; profile auto-population pending)  
**Critical Path:** YES

---

## 📌 Week Overview

**Goal:** Build hotel package CRUD and the foundations for template-driven creation.

---

## ✅ Implemented In Repo (as of 26 Dec 2025)

- **Schema**: `HotelPackage` + `HotelPackageAmenity` with `PackageStatus` enum
- **Read APIs**:
  - `GET /v1/hotel-packages` (paginated list + filtering)
  - `GET /v1/hotel-packages/:id` (detail + amenities)
- **Create API (DRAFT)**:
  - `POST /v1/hotel-packages/:providerId/packages`
  - Guarded by auth + provider ownership (draft creation does not require verification)

- **Template catalog API**:
  - `GET /v1/hotel-packages/templates` (14 supported templates)
  - `templateId` is validated against this catalog

- **Lifecycle APIs**:
  - `POST /v1/hotel-packages/:providerId/packages/:packageId/publish` (requires verified/approved provider)
  - `POST /v1/hotel-packages/:providerId/packages/:packageId/pause`
  - `POST /v1/hotel-packages/:providerId/packages/:packageId/archive`

- **Update/Delete APIs (DRAFT only)**:
  - `PATCH /v1/hotel-packages/:providerId/packages/:packageId`
  - `DELETE /v1/hotel-packages/:providerId/packages/:packageId`

- **Host property snapshot (prefill support)**:
  - `GET /v1/host/properties/:id/snapshot`
  - Returns: property + rooms + amenities + onboarding policies (media optional/nullable)

**Note:** Snapshot is **UI prefill only** (no server-side auto-copy guarantee). `media` remains nullable until onboarding stores media steps.

**Important rules enforced in code:**

- Draft creation allowed regardless of provider verification
- Publish requires provider ownership/admin AND `verificationStatus === 'APPROVED'`
- `listingId` must belong to the `:providerId` (prevents cross-provider package creation)

**Key files:**

- [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- [backend/src/listings/hotel_packages/hotel-packages.controller.ts](backend/src/listings/hotel_packages/hotel-packages.controller.ts)
- [backend/src/listings/hotel_packages/hotel-packages.service.ts](backend/src/listings/hotel_packages/hotel-packages.service.ts)
- [backend/src/listings/hotel_packages/dto/create-hotel-package.dto.ts](backend/src/listings/hotel_packages/dto/create-hotel-package.dto.ts)
- [backend/src/listings/hotel_packages/dto/update-hotel-package.dto.ts](backend/src/listings/hotel_packages/dto/update-hotel-package.dto.ts)
- [backend/src/listings/hotel_packages/hotel-package-templates.ts](backend/src/listings/hotel_packages/hotel-package-templates.ts)
- [backend/src/listings/hotel_packages/dto/list-hotel-packages.query.dto.ts](backend/src/listings/hotel_packages/dto/list-hotel-packages.query.dto.ts)
- E2E list/detail coverage: [backend/test/listings.e2e.spec.ts](backend/test/listings.e2e.spec.ts)
- E2E create/publish coverage: [backend/test/hotel-packages.publish.e2e.spec.ts](backend/test/hotel-packages.publish.e2e.spec.ts)
- E2E update/delete coverage: [backend/test/hotel-packages.crud.e2e.spec.ts](backend/test/hotel-packages.crud.e2e.spec.ts)
- Snapshot endpoint: [backend/src/host/host-properties.controller.ts](backend/src/host/host-properties.controller.ts)
- Snapshot E2E: [backend/test/host-properties.snapshot.e2e.spec.ts](backend/test/host-properties.snapshot.e2e.spec.ts)

---

## 🧭 Planned / Not Implemented Yet

- Deeper auto-population rules inside hotel packages (beyond prefill), if needed by product

---

## 🎯 Success Criteria

✅ Read endpoints available (list + detail)  
✅ Create DRAFT endpoint exists and enforces provider ownership  
✅ Seeded list/detail E2E coverage passing (`pnpm test:e2e`)  
✅ 14 template catalog available via API  
✅ Publish/pause/archive implemented (publish gated by provider verification)  
✅ Full CRUD coverage (update/delete)

**Unblocks:** Week 6 (Tour Packages Part 1)

---

**Last Updated:** 26 Dec 2025
