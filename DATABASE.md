# TripAvail Database Schema

**Last Updated:** 25 Dec 2025  
**Schema Version:** Week 2 Complete  
**Database:** PostgreSQL 16

---

## Core Entities

### Users & Auth

**User**

- Default role: `TRAVELER` (admin managed separately)
- Nullable `email` and `phone` (at least one required for login)
- `emailVerified` / `phoneVerified` flags
- One user can have multiple provider profiles

**AuthOtp**

- OTP codes for phone/email login
- 5-minute TTL
- Track attempts and consumed status

**ProviderProfile**

- `providerType`: HOTEL_MANAGER | TOUR_OPERATOR
- `verificationStatus`: NOT_STARTED → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/SUSPENDED
- Unique constraint on `[userId, providerType]` (one user can be both hotel manager and tour operator)

**ProviderOnboarding**

- Tracks onboarding step progress per provider
- `completedSteps` JSON stores checklist
- `submittedAt`, `approvedAt`, `rejectedAt` timestamps

---

## Products

### Stays

**Listing**

- Hotel property data (address, coordinates, check-in/out times)
- Status: DRAFT → PUBLISHED → PAUSED/ARCHIVED

**Room**

- Room types within a listing (capacity, bed config, base price)

**InventoryNight**

- Nightly inventory per room type
- `availableUnits` decremented atomically on booking HOLD

### Hotel Packages

**HotelPackage**

- Template-based packages (Weekend Getaway, Honeymoon, etc.)
- References a `Listing` and room types
- `availabilityRule`: WEEKEND_ONLY, SEASONAL, FLEXIBLE
- Price per person

### Tour Packages

**TourPackage**

- Multi-day itinerary-based packages
- `duration` in days, `maxSeats` per departure

**ItineraryDay**

- Day-by-day breakdown of tour activities

**Pickup**

- Pickup/drop-off locations (city, coordinates)

**TourDeparture**

- Departure-specific inventory (availableSeats per date)

---

## Bookings & Payments

### Booking State Machine

```
QUOTE → HOLD → PAYMENT_PENDING → CONFIRMED → COMPLETED
         ↓
    EXPIRED_HOLD / CANCELLED_BY_GUEST / CANCELLED_BY_PROVIDER
```

**Booking**

- `productType`: STAY | HOTEL_PACKAGE | TOUR_PACKAGE
- `priceSnapshot`: JSON stores server-calculated breakdown (never recompute)
- `idempotencyKey`: Ensures duplicate requests don't create multiple bookings
- `holdExpiresAt`: TTL for inventory hold (use BullMQ for auto-expiry)

**Payment**

- Provider-agnostic (Stripe, PayPal, etc.)
- `providerTxnId` stores external transaction ID

**LedgerEntry**

- Double-entry accounting for all financial events
- `type`: DEBIT | CREDIT
- `account`: TRAVELER, PROVIDER_EARNINGS, COMMISSION
- Every booking confirmation creates paired entries

---

## Indexing Strategy

### High-Priority Indexes (Already Applied)

**User**

- `email`, `phone`, `role` (login + RBAC queries)

**ProviderProfile**

- `verificationStatus` (admin dashboard)
- `[userId, providerType]` unique constraint

**Listing**

- `providerId`, `status`, `city` (search + filtering)

**Room**

- `listingId` (eager loading)

**InventoryNight**

- `date` (availability queries)
- `[roomId, date]` unique constraint (atomic updates)

**HotelPackage**

- `providerId`, `listingId`, `status` (catalog queries)

**TourPackage**

- `providerId`, `status` (catalog queries)

**TourDeparture**

- `departureDate` (availability queries)
- `[packageId, departureDate]` unique constraint

**Booking**

- `userId`, `providerId`, `status`, `idempotencyKey` (user/provider dashboards + idempotency)

**Payment**

- `provider`, `status` (reconciliation)

**LedgerEntry**

- `bookingId`, `account`, `createdAt` (reports + audit)

### Future Indexes (Post-MVP)

- Full-text search on `Listing.description` (after 10k+ listings)
- GIN index on `Booking.priceSnapshot` for JSON queries
- Composite index on `[Booking.status, Booking.createdAt]` for paginated lists

---

## Critical Rules

### Inventory Locking (Atomic)

**Stays & Hotel Packages:**

```sql
UPDATE inventory_nights
SET available_units = available_units - :requested
WHERE room_id = :id AND date = :night AND available_units >= :requested
```

**Tour Packages:**

```sql
UPDATE tour_departures
SET available_seats = available_seats - :seats
WHERE package_id = :id AND departure_date = :date AND available_seats >= :seats
```

**Always use Postgres transactions. Redis is cache only.**

### Price Snapshots

- Server calculates and persists at HOLD → CONFIRMED
- Never recompute historical prices (invoice/refund use snapshot)

### Publishing Gates

- `ProviderProfile.verificationStatus === APPROVED` required
- Listings/packages remain in DRAFT until provider verified

### Idempotency

- All mutating endpoints (POST/PATCH/DELETE) accept `Idempotency-Key` header
- Store keys in Redis with 24h TTL
- Return cached response for duplicate keys

---

## Migrations

**Applied:**

1. `week2_auth_provider_updates` (User defaults, nullable email/phone, ProviderOnboarding)
2. `add_complete_schema` (Listings, Rooms, Inventory, Packages, Tours, Ledger)

**Rollback Plan:**

```bash
# View migration history
npx prisma migrate status

# Rollback last migration (NOT RECOMMENDED IN PRODUCTION)
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Seed Data (Development)

```bash
# Create seed script
npx prisma db seed
```

**Recommended seed:**

- 2 test users (1 traveler, 1 admin)
- 2 provider profiles (1 hotel, 1 tour operator) with APPROVED status
- 3 sample listings (2 hotels, 1 tour)
- Inventory for next 90 days

---

## Performance Notes

- Use `SELECT FOR UPDATE` when locking inventory rows
- Batch inventory inserts (90-day chunks)
- Connection pooling: 10-20 connections per backend instance
- Read replicas for reporting queries (future)

---

## Backup & Recovery

**Development:**

```bash
# Backup
docker exec tripavail_postgres pg_dump -U postgres tripavail > backup.sql

# Restore
docker exec -i tripavail_postgres psql -U postgres tripavail < backup.sql
```

**Production:**

- Automated daily backups with 30-day retention
- Point-in-time recovery enabled
- Test restores monthly
