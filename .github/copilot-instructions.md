# TripAvail - AI Agent Development Guide

## System Overview

TripAvail is a **two-sided travel marketplace** with three core product types: Stays (room-nights), Hotel Packages (template-based bundles), and Tour Packages (itinerary-driven experiences). The platform uses an **Airbnb-style onboarding** model where providers set up their property/operator profile once, then reuse that data across multiple packages.

**Architecture:** Modular monolith (NestJS backend) serving Next.js web portal and Flutter mobile apps via a single versioned API.

## Critical Development Ports

- **Web:** `4000` (Next.js)
- **API:** `4100` (NestJS)
- **Postgres:** `5432`
- **Redis:** `6379`
- **Meilisearch:** `7700`

_Note: Port 3000 is intentionally avoided._

## Core Architectural Patterns

### 1. Booking State Machine (CRITICAL - Never Skip States)

```
QUOTE → HOLD → PAYMENT → CONFIRMED → COMPLETED
         ↓
    EXPIRED_HOLD / CANCELLED_BY_GUEST / CANCELLED_BY_PROVIDER
```

**Rules:**

- HOLD reserves inventory with TTL (use BullMQ job for auto-expiry)
- Use row-level locks in Postgres for atomic inventory decrements
- Server calculates and persists price snapshots at CONFIRM - never recompute
- Idempotency keys required on hold/payment endpoints

### 2. Provider Verification Gates

**Publishing is blocked until:**

- Provider verification status = `APPROVED`
- For hotels: Property profile status = `APPROVED`

**Draft creation is always allowed.** Suspended providers auto-pause all listings.

### 3. Property Setup Reuse Pattern

Hotel onboarding creates a **single source of truth** for property data (rooms, amenities, policies, media). Hotel packages **reference this profile** - providers never re-enter the same data. Room types, amenities, and policies are auto-pulled into packages.

## Data Model Principles

### Inventory Locking

**Stays & Hotel Packages:**

```sql
-- Lock room-night units transactionally
UPDATE inventory_nights
SET available_units = available_units - :requested
WHERE listing_id = :id AND date = :night AND available_units >= :requested
```

**Tour Packages:**

```sql
-- Lock seats on departure
UPDATE tour_departures
SET available_seats = available_seats - :seats
WHERE package_id = :id AND departure_date = :date AND available_seats >= :seats
```

**Always use Postgres transactions; Redis is cache only.**

### Ledger (Double-Entry Accounting)

Every financial event creates paired entries:

- Booking confirms: Debit traveler, Credit provider earnings + platform commission
- Refunds: Reverse original entries
- Payouts: Move provider earnings to payout batch

**Never compute historical totals on-the-fly - use persisted snapshots.**

## Module Structure (NestJS)

```
backend/
├── src/
│   ├── common/          # Shared utilities, guards, interceptors
│   ├── auth/            # JWT, sessions, OAuth
│   ├── users/           # User management
│   ├── rbac/            # Role-based access control
│   ├── audit/           # Audit logs (all admin actions)
│   ├── providers/       # Provider profiles
│   ├── provider_onboarding/  # Property setup, operator setup
│   ├── kyc/             # KYC documents, verification workflow
│   ├── listings/        # Stay listings
│   ├── rooms/           # Room types, inventory
│   ├── hotel_packages/  # Hotel package templates + CRUD
│   ├── tour_packages/   # Tour package builder (14 steps)
│   ├── bookings/        # Core booking engine
│   ├── pricing/         # Quote calculation, rate plans
│   ├── payments/        # Provider-agnostic payment gateway
│   ├── refunds/         # Refund state machine
│   ├── ledger/          # Double-entry accounting
│   ├── payouts/         # Payout batches, statements
│   ├── messaging/       # Real-time chat (WebSocket)
│   ├── notifications/   # Notification outbox + delivery tracking
│   ├── reviews/         # Reviews, moderation
│   ├── support/         # Tickets, disputes
│   ├── search/          # Meilisearch indexing queue
│   ├── cms/             # Content management
│   └── analytics/       # Events, reporting
```

## API Design Rules

1. **Versioning:** All routes prefixed with `/v1`
2. **OpenAPI/Swagger:** Single source of truth for contracts
3. **Idempotency:** Use `Idempotency-Key` header on mutating endpoints
4. **Price Snapshots:** Store server-calculated breakdown at confirm; use for invoices/refunds
5. **DTO Validation:** Strict whitelist mode with `class-validator`
6. **RBAC Guards:** Apply to all protected routes; audit admin actions
7. **Signed URLs:** For media uploads; validate MIME types

## Key Workflows & Side Effects

### Booking Confirmation Side Effects (use BullMQ jobs)

- Send confirmation email/SMS
- Index booking for search/analytics
- Create ledger entries
- Schedule provider payout eligibility
- Update inventory cache

### Provider Verification Approval

- Audit log entry (who/when/reason)
- Emit `provider.verified` event
- Allow publishing of draft listings/packages
- Send approval notification

### Search Indexing (Event-Driven)

When a listing/package is published/updated, queue a job to sync to Meilisearch. Never block the HTTP response on indexing.

## Hotel Package Templates (14 Total)

1. Weekend Getaway, 2. Honeymoon, 3. Family Vacation, 4. Corporate Retreat, 5. Ski/Snow Holiday, 6. Golf Getaway, 7. Staycation, 8. Wellness & Spa, 9. Cultural Experience, 10. Food & Wine, 11. Anniversary, 12. Eco-Nature, 13. Festival & Events, 14. Adventure

**Template behavior:** Room type selector auto-updates price; inclusions/exclusions lists; policy presets; optional pickup; date/availability rules (weekend-only, seasonal, flexible).

## Tour Package Builder (14 Steps)

1. Choose Trip Type (icon grid)
2. Package Basics
3. Dates & Departure
4. Pickup & Drop-off (map + list)
5. Highlights (icon chips)
6. Itinerary (day builder)
7. Inclusions & Exclusions
8. Pricing & Policies
9. Media Upload
10. Add-ons
11. Special Notes & Safety
12. Compliance & Disclaimers
13. Preview Listing
14. Publish → Success (gated by verification)

## Security & Engineering Rules

- **Migrations only:** No manual schema edits
- **Background jobs:** All side effects (notifications, indexing) run async; jobs must be idempotent
- **Never trust client totals:** Server calculates, stores, and returns price breakdowns
- **Upload security:** Signed URLs, MIME validation, metadata-only in DB
- **Webhook event logs:** Store all payment gateway webhooks for replay/audit
- **Feature flags:** Use for safe rollouts (e.g., new payment provider)

## Common Pitfalls to Avoid

❌ Re-computing past invoice totals (use snapshots)  
❌ Publishing without verification checks  
❌ Blocking HTTP responses on email/search indexing  
❌ Missing idempotency keys on payments  
❌ Client-side price calculations trusted by server  
❌ Manual inventory adjustments (always use transactions)  
❌ Forgetting audit logs on admin actions

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start local services (Docker)
docker-compose up -d

# Run migrations
pnpm migration:run

# Start backend (port 4100)
cd backend && pnpm dev

# Start web portal (port 3100)
cd web && pnpm dev
```

## Code Quality Standards

### Type Safety

- **Strict TypeScript mode** enabled
- **Shared types** between frontend/backend (`shared/types/`)
- **OpenAPI code generation** for API contracts
- Use `class-validator` and `class-transformer` for DTOs

### Error Handling

All errors must follow this structure:

```typescript
{
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId: string;  // For tracing
  details?: unknown;   // Validation errors
}
```

### Request Context

- Every request gets a unique `requestId` (X-Request-ID header)
- Log all operations with request context
- Use structured logging (JSON format)

### Validation & Sanitization

```typescript
// Sanitize HTML inputs
@Transform(({ value }) => sanitizeHtml(value))
description: string;

// Validate nested objects
@ValidateNested()
@Type(() => AddressDto)
address: AddressDto;
```

### Rate Limiting

- Anonymous: 10 req/min
- Authenticated: 100 req/min
- Providers: 500 req/min
- Admin: Unlimited
- Login endpoint: 3 req/5min (stricter)

### Security Headers

- Use Helmet.js for security headers
- CORS with explicit origin whitelist (never `*`)
- Input sanitization on all string fields
- Password requirements: min 12 chars, uppercase, lowercase, number, special char

### Idempotency

- All POST/PATCH/DELETE endpoints support `Idempotency-Key` header
- Store keys in Redis with 24h TTL
- Return cached response for duplicate keys

### Health Checks

- `GET /health` - Basic liveness check
- `GET /health/ready` - Readiness check (tests DB, Redis, Meilisearch)
- Implement graceful shutdown on SIGTERM

## Testing Strategy

- **Unit tests:** Business logic in services
- **Integration tests:** API endpoints with test DB
- **E2E tests:** Critical flows (booking, verification)
- **Load tests:** Inventory locking under concurrency

## Delivery Phases

**Phase 1 (MVP):** Hotel/operator onboarding, verification gates, hotel packages, tour package builder, booking engine with holds, mock payments, basic search.

**Phase 2 (Payments):** Real payment integration, webhooks, refunds, ledger, payouts, disputes.

**Phase 3 (Scale):** OpenSearch, observability, multi-region, promotions, multi-currency.

## Quick Reference

**Need to add a new product type?** Follow the booking state machine, add inventory locking, create search indexing job, implement price snapshot logic.

**Need to gate a feature?** Check `provider.verificationStatus === 'APPROVED'` + property approval if hotel.

**Need to modify pricing?** Always persist snapshots; never alter confirmed booking prices.

**Need to add an admin action?** Require RBAC guard + audit log entry.

---

_Last updated: 25 Dec 2025 | Blueprint version: 1.0_
