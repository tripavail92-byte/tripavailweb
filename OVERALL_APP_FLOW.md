# TripAvail - Overall App Flow & Architecture

## 📋 Executive Summary

TripAvail is a **two-sided travel marketplace** enabling travelers to discover and book stays, hotel packages, and tour packages from verified providers. The system employs:

- **NestJS modular monolith** backend (port 4100)
- **Next.js web portal** (port 4000)
- **Flutter mobile app** (future phase)
- **PostgreSQL + Redis + Meilisearch** data layers
- **Event-driven architecture** with BullMQ job queue

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interfaces                           │
├─────────────────┬──────────────────────┬────────────────────┤
│   Next.js Web   │   Flutter Mobile      │   Admin Dashboard  │
│   (port 4000)   │   (future)            │   (included)       │
└────────┬────────┴──────────┬───────────┴────────┬───────────┘
         │                   │                    │
         └───────────────────┴────────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │    API Gateway (Versioned)      │
        │    NestJS Backend (port 4100)   │
        │    /v1/...                      │
        └──────────────┬──────────────────┘
         ┌────────────┴────────────────┐
         ↓                             ↓
    ┌─────────────────┐        ┌──────────────────┐
    │  PostgreSQL     │        │  Redis Cache     │
    │  Primary DB     │        │  Sessions, Jobs  │
    │  (port 5432)    │        │  (port 6379)     │
    └─────────────────┘        └──────────────────┘
         ↑                             ↓
         │                      ┌──────────────────┐
         │                      │  BullMQ Queue    │
         │                      │  Async Jobs      │
         │                      └──────────────────┘
         └──────────────────────────────────────────┐
                                                    ↓
                                        ┌──────────────────────┐
                                        │  Meilisearch         │
                                        │  Full-Text Search    │
                                        │  (port 7700)         │
                                        └──────────────────────┘
```

---

## 🔄 Complete User Journey

### Phase 1: Authentication & Provider Setup

```
1. USER REGISTRATION
   └─→ POST /v1/auth/register
       ├─→ Validate email format
       ├─→ Hash password (bcrypt)
       ├─→ Create User record (users table)
       ├─→ Assign default role (traveler|provider)
       └─→ Send verification email (async job)

2. OTP LOGIN (OPTIONAL)
   └─→ POST /v1/auth/otp/request
       ├─→ Generate 6-digit OTP
       ├─→ Store in Redis with 5-min TTL
       ├─→ Send via SMS/email
       └─→ Return pending auth state

3. VERIFY & GET TOKEN
   └─→ POST /v1/auth/otp/verify
       ├─→ Validate OTP against Redis
       ├─→ Clear OTP from Redis
       ├─→ Issue JWT token (24h expiry)
       └─→ Issue refresh token (30d)

4. PROVIDER ONBOARDING (IF PROVIDER)
   └─→ POST /v1/v1/provider-onboarding/start
       ├─→ Create draft provider profile
       ├─→ Initialize KYC document collection
       └─→ Set verification_status = PENDING
       
   └─→ POST /v1/provider-onboarding/complete
       ├─→ Submit KYC documents
       ├─→ Trigger admin verification workflow
       ├─→ Update audit_log with submission
       └─→ Wait for APPROVED status
```

### Phase 2: Provider Property/Operator Setup (Reusable Pattern)

```
HOTEL PROVIDER:
1. Create Property Profile
   └─→ POST /v1/provider-onboarding/property
       ├─→ Location (address, coordinates)
       ├─→ Basic info (name, description, images)
       ├─→ Amenities (auto-checked from list)
       └─→ Policies (cancellation, check-in/out)

2. Define Room Types
   └─→ POST /v1/provider-onboarding/rooms
       ├─→ Room type (double, single, suite)
       ├─→ Quantity available
       ├─→ Max guests per room
       └─→ Base price

3. Property Approval Gate
   └─→ Admin reviews & approves property
       ├─→ Audit log: Admin action
       └─→ Emit: property.approved event

TOUR OPERATOR:
1. Create Operator Profile
   └─→ POST /v1/operator-profile
       ├─→ Company name & description
       ├─→ Contact person & credentials
       ├─→ Bank details for payouts
       └─→ Logo/branding

2. No property approval needed (operator-based)
```

### Phase 3: Listing Creation

```
HOTEL PACKAGE PATH:
1. Browse Templates
   └─→ GET /v1/hotel-packages/templates
       └─→ [Weekend Getaway, Honeymoon, Family Vacation, ...]

2. Create from Template
   └─→ POST /v1/hotel-packages
       ├─→ Select template
       ├─→ Define dates (seasonal or year-round)
       ├─→ Select room type (pulls from property)
       ├─→ Set pricing (per room-night)
       ├─→ Inclusions/exclusions
       ├─→ Optional pickup service
       ├─→ Upload media (images, video)
       └─→ Create as DRAFT

3. Publish Package
   └─→ PATCH /v1/hotel-packages/:id/publish
       ├─→ Verify: provider.verification_status = APPROVED
       ├─→ Verify: property.status = APPROVED
       ├─→ Update: status = PUBLISHED
       ├─→ Queue: Search indexing job (async)
       └─→ Return: Published package details

TOUR PACKAGE PATH:
1. Multi-Step Builder (14 Steps)
   └─→ POST /v1/tour-packages/start
       ├─→ Trip type selection
       ├─→ Basic details (title, description)
       ├─→ Dates & departure schedules
       ├─→ Pickup/drop-off locations
       ├─→ Highlights (activity tags)
       ├─→ Day-by-day itinerary
       ├─→ Inclusions/exclusions
       ├─→ Pricing (per person)
       ├─→ Media uploads
       ├─→ Add-ons (optional extras)
       ├─→ Safety & compliance notes
       ├─→ Insurance & liability disclaimers
       ├─→ Preview package
       └─→ Save as DRAFT

2. Publish Tour Package
   └─→ PATCH /v1/tour-packages/:id/publish
       ├─→ Verify: provider.verification_status = APPROVED
       ├─→ Create initial departures (based on schedules)
       ├─→ Update: status = PUBLISHED
       ├─→ Queue: Search indexing job
       └─→ Return: Published package
```

### Phase 4: Traveler Search & Discovery

```
1. SEARCH BY CRITERIA
   └─→ GET /v1/search/packages
       ├─→ Query params: destination, dates, guests, type
       ├─→ Query Meilisearch (full-text + filters)
       ├─→ Return ranked results (relevance + reviews)
       └─→ Include pricing snapshot (base price)

2. VIEW PACKAGE DETAILS
   └─→ GET /v1/{stays|hotel-packages|tour-packages}/:id
       ├─→ Full description & media
       ├─→ All inclusions/exclusions
       ├─→ Pricing breakdown
       ├─→ Reviews & ratings (5 stars)
       ├─→ Availability (calendar for stays/hotels)
       └─→ Departure dates (for tours)

3. CHECK AVAILABILITY
   └─→ GET /v1/{stays|hotel-packages}/:id/availability
       └─→ Query inventory by date range
           ├─→ Check available_units (stays/hotel)
           ├─→ Check available_seats (tours)
           └─→ Return availability calendar
```

### Phase 5: Booking Lifecycle (CRITICAL State Machine)

```
STATE FLOW: QUOTE → HOLD → PAYMENT → CONFIRMED → COMPLETED
                     ↓
                [EXPIRED_HOLD|CANCELLED_*]

1. REQUEST QUOTE
   └─→ POST /v1/bookings/quote
       ├─→ Validate dates/availability
       ├─→ Calculate base price + taxes + fees
       ├─→ Apply promotions/discounts
       ├─→ Persist price snapshot (JSON)
       ├─→ Status: QUOTE (no inventory reserved)
       └─→ Return: Quote details + ID (valid 10 mins)

2. CREATE HOLD (Reserve Inventory)
   └─→ POST /v1/bookings/:quoteId/hold
       ├─→ Acquire row-level lock on inventory
       ├─→ Decrement available_units/seats
       ├─→ Create HOLD record with TTL
       ├─→ Schedule auto-expiry job (15 mins)
       ├─→ Idempotency-Key prevents double-holds
       └─→ Return: HOLD ID + expiry timestamp

3. PROCESS PAYMENT
   └─→ POST /v1/bookings/:holdId/payment
       ├─→ Amount: Use persisted price snapshot
       ├─→ Call Stripe (or mock provider)
       ├─→ Handle webhook callbacks:
       │   ├─→ payment.succeeded → PAYMENT status
       │   ├─→ payment.failed → Release hold, return inventory
       │   └─→ payment.processing → Keep hold, wait
       └─→ Return: Payment status + ID

4. CONFIRM BOOKING
   └─→ POST /v1/bookings/:paymentId/confirm
       ├─→ Verify payment status = SUCCEEDED
       ├─→ Update booking status = CONFIRMED
       ├─→ Create ledger entries:
       │   ├─→ Debit: Traveler payment
       │   ├─→ Credit: Provider earnings
       │   └─→ Credit: Platform commission
       ├─→ Queue side-effect jobs:
       │   ├─→ Send confirmation email
       │   ├─→ Create invoice PDF
       │   ├─→ Notify provider in real-time chat
       │   └─→ Index booking for analytics
       ├─→ Return: Confirmed booking with invoice
       └─→ Booking now locked (no refunds except via refund module)

5. COMPLETE BOOKING (Post-Trip)
   └─→ Automatically on trip end date + 1 day
       ├─→ Update status = COMPLETED
       ├─→ Trigger review request email
       └─→ Open review submission window (14 days)
```

### Phase 6: Refunds (Optional Path)

```
TRAVELER REQUESTS REFUND:
1. Initiate Refund Request
   └─→ POST /v1/refunds
       ├─→ Provide booking ID + reason
       ├─→ Check refund policy (non-refundable?)
       ├─→ Calculate refund % (full|partial|none)
       ├─→ Create REFUND_REQUESTED record
       └─→ Notify provider in chat

2. Provider Reviews & Decides
   └─→ PATCH /v1/refunds/:id/approve|reject
       ├─→ If approved:
       │   ├─→ Create reverse ledger entries
       │   ├─→ Initiate refund to Stripe
       │   ├─→ Update status = REFUNDED
       │   └─→ Send confirmation emails
       └─→ If rejected:
           ├─→ Update status = REJECTED
           └─→ Send rejection email with reason

3. Dispute Resolution (Optional)
   └─→ If traveler disputes rejection:
       └─→ POST /v1/disputes
           ├─→ Escalate to admin team
           ├─→ Admin reviews evidence
           ├─→ Admin decision (approve/reject)
           └─→ Enforce admin decision via ledger
```

### Phase 7: Payouts

```
PROVIDER EARNINGS CYCLE:
1. Earnings Accrue
   └─→ Each confirmed booking creates ledger entry:
       ├─→ Credit: provider_earnings (debit account)
       └─→ Hold until payout window

2. Batch Payout Creation (Monthly)
   └─→ PATCH /v1/payouts/batch (admin only)
       ├─→ Calculate provider earnings balance
       ├─→ Create payout batch for period
       ├─→ Include all non-disputed bookings
       └─→ Status: PENDING_INITIATION

3. Initiate Payout
   └─→ PATCH /v1/payouts/batch/:id/initiate
       ├─→ Verify provider bank details
       ├─→ Call Stripe Connect (or ACH)
       ├─→ Update status = INITIATED
       └─→ Create invoice PDF

4. Confirm Payout (Webhook from Stripe)
   └─→ Payment gateway webhook callback:
       ├─→ payment.payout.paid → status = PAID
       ├─→ payment.payout.failed → status = FAILED
       └─→ Log webhook in audit trail
```

### Phase 8: Post-Booking Engagement

```
1. REVIEWS & RATINGS
   └─→ POST /v1/reviews
       ├─→ Available after booking status = COMPLETED
       ├─→ 5-star rating + text review
       ├─→ Moderation queue (check for abuse)
       ├─→ Public display on listing (after approval)
       └─→ Update provider avg rating

2. MESSAGING (WebSocket)
   └─→ WS /v1/messages
       ├─→ Real-time 1:1 chat: Traveler ↔ Provider
       ├─→ Booking context auto-included
       ├─→ Message history persisted
       └─→ Notifications for new messages

3. SUPPORT TICKETS
   └─→ POST /v1/support/tickets
       ├─→ Issue reporting (damage, service, etc.)
       ├─→ Ticket status tracking (open|resolved|disputed)
       └─→ Integration with disputes module
```

---

## 📁 Backend Module Structure

### 1. **Authentication & Authorization**
- **auth/** - JWT tokens, OTP, sessions, OAuth setup
- **rbac/** - Role-based access control (Guest, Traveler, Provider, Admin)
- **partners/** - Third-party OAuth integration

### 2. **User & Provider Management**
- **users/** - User profiles, preferences, account settings
- **providers/** - Provider profiles, verification status, bank details
- **provider_onboarding/** - Multi-step provider setup workflow
- **operator_profile/** - Tour operator specific setup
- **kyc/** - Know-Your-Customer document collection & verification

### 3. **Listings (Inventory)**
- **listings/stays/** - Room-night stays (single rooms)
- **listings/hotel_packages/** - Template-based hotel packages
- **listings/tour_packages/** - Multi-step tour package builder
- **listings/amenities/** - Shared amenities list

### 4. **Booking & Payments**
- **bookings/** - Core booking state machine (QUOTE → HOLD → PAYMENT → CONFIRMED → COMPLETED)
- **payments/** - Stripe integration, webhook handling, payment processing
- **pricing/** - Quote calculation, rate plans, dynamic pricing
- **cancellation/** - Hold auto-expiry, cancellation logic

### 5. **Financial Module**
- **ledger/** - Double-entry accounting (all transactions logged)
- **refunds/** - Refund state machine, traveler requests, approval workflow
- **payouts/** - Provider earnings batches, monthly payouts
- **disputes/** - Dispute escalation, admin resolution

### 6. **Search & Discovery**
- **search/** - Meilisearch indexing queue, search API
- **host/** - Host/provider storefront, listing management

### 7. **Admin & Compliance**
- **admin/** - Admin dashboard, bulk actions, reporting
- **audit/** - Audit log for all admin actions & state changes
- **cms/** - Content management, FAQs, blog posts

### 8. **Supporting Services**
- **health/** - Liveness & readiness checks
- **notifications/** - Email/SMS delivery via outbox pattern
- **common/** - Shared utilities, guards, filters, middleware

---

## 🔐 Access Control & Verification Gates

### Permission Levels
```
GUEST (Unauthenticated)
  ├─→ Read public listings
  ├─→ Search packages
  └─→ View pricing

TRAVELER (Authenticated)
  ├─→ All GUEST permissions
  ├─→ Create bookings
  ├─→ Request quotes
  ├─→ Manage bookings (hold, confirm, request refund)
  ├─→ Message providers
  ├─→ Leave reviews
  └─→ Submit support tickets

PROVIDER (Verified)
  ├─→ All TRAVELER permissions
  ├─→ Complete provider onboarding
  ├─→ Create listings (if verification = APPROVED)
  ├─→ Manage listings (edit, publish, pause)
  ├─→ View booking inquiries
  ├─→ Approve/reject refunds
  ├─→ View earnings & payouts
  └─→ Message travelers

ADMIN
  ├─→ All PROVIDER permissions
  ├─→ Approve/reject provider verification
  ├─→ Approve property profiles
  ├─→ View all users, bookings, disputes
  ├─→ Process disputes
  ├─→ Initiate payouts
  ├─→ View audit logs
  └─→ CMS management
```

### Publishing Gate (Provider)
```
Can publish a listing IF AND ONLY IF:
  ✓ provider.verificationStatus === 'APPROVED'
  ✓ (for hotels) property.status === 'APPROVED'
  
DRAFT creation is always allowed.
```

### Suspended Providers
```
If provider.status === 'SUSPENDED':
  ├─→ All published listings auto-paused
  ├─→ Cannot create new listings
  ├─→ Cannot manage existing listings
  └─→ Can still message & see past bookings
```

---

## 🔄 Core Data Flows

### Inventory Management

**Stays & Hotel Packages:**
```sql
-- Reserve room-night atomically
BEGIN TRANSACTION;
  SELECT available_units FROM inventory_nights 
    WHERE listing_id = :id AND date = :night 
    FOR UPDATE; -- Row-level lock
  
  IF available_units >= :requested:
    UPDATE inventory_nights 
      SET available_units = available_units - :requested
      WHERE listing_id = :id AND date = :night;
  ELSE:
    ROLLBACK; -- Insufficient availability
COMMIT;
```

**Tour Packages:**
```sql
-- Reserve seats on specific departure
UPDATE tour_departures
SET available_seats = available_seats - :seats
WHERE package_id = :id AND departure_date = :date 
AND available_seats >= :seats;
```

### Price Snapshots (NEVER recompute past prices)

```typescript
// At HOLD creation
const quote = {
  basePrice: 1000,
  taxes: 100,
  platformFee: 50,
  providerFee: 0,
  totalPrice: 1150,
  breakdown: {...}, // Detailed JSON
  timestamp: NOW(),
  expiresAt: NOW() + 10 minutes
};

// Persist snapshot with booking
booking.priceSnapshot = quote;

// At CONFIRM
// Use persisted snapshot, never recalculate
```

### Ledger Entries (Double-Entry)

```typescript
// Booking confirmed for $1000
await ledger.createEntries([
  {
    type: 'BOOKING_CONFIRMED',
    debitAccount: 'traveler_payments', // Traveler paid
    creditAccount: 'platform_held_funds',
    amount: 1000,
    bookingId: booking.id,
  },
  {
    type: 'BOOKING_CONFIRMED',
    debitAccount: 'platform_commission', // Platform keeps 15%
    creditAccount: 'provider_earnings',
    amount: 150, // Commission
    bookingId: booking.id,
  },
  {
    type: 'BOOKING_CONFIRMED',
    debitAccount: 'platform_held_funds', // Provider gets 85%
    creditAccount: 'provider_earnings',
    amount: 850,
    bookingId: booking.id,
  },
]);

// At refund approval
// Create REVERSE entries (debit/credit flip)
```

---

## 🎯 Async Job Queue (BullMQ)

All side effects run asynchronously to prevent blocking HTTP responses:

| Job | Trigger | Purpose |
|-----|---------|---------|
| `hold.expire` | HOLD created | Auto-expire hold after 15 mins |
| `booking.confirmation.email` | BOOKING confirmed | Send confirmation email |
| `booking.invoice` | BOOKING confirmed | Generate & store invoice PDF |
| `booking.provider.notification` | BOOKING confirmed | Notify provider in real-time |
| `listing.index` | Listing published | Index in Meilisearch |
| `review.moderation` | Review submitted | Check for abuse |
| `refund.notification` | Refund status change | Notify traveler/provider |
| `payout.batch.initiate` | Admin initiated | Send to payment gateway |
| `analytics.event` | Various | Log events for dashboard |

**Job Characteristics:**
- ✓ Idempotent (safe to retry)
- ✓ Exponential backoff on failure
- ✓ Max 3 retries before dead-letter
- ✓ WebSocket notifications for real-time updates

---

## 🏨 Hotel Package Feature Highlights

### 14 Built-in Templates
1. Weekend Getaway
2. Honeymoon
3. Family Vacation
4. Corporate Retreat
5. Ski/Snow Holiday
6. Golf Getaway
7. Staycation
8. Wellness & Spa
9. Cultural Experience
10. Food & Wine
11. Anniversary
12. Eco-Nature
13. Festival & Events
14. Adventure

### Template Features
```typescript
template.features = {
  roomTypeSelector: true,      // Auto-updates price
  inclusionsList: [...],       // Customizable
  exclusionsList: [...],       // Customizable
  policyPresets: ['moderate'], // Cancellation, late check-out
  optionalPickup: true,        // Add-on service
  dateRules: {
    weekendOnly: false,
    seasonal: false,
    flexibility: 'exact|±1day|flexible'
  }
};
```

---

## 🚀 Tour Package Builder (14 Steps)

1. **Trip Type** - Icon grid (adventure, cultural, relaxation, etc.)
2. **Package Basics** - Title, description, duration
3. **Dates & Departure** - Schedule multiple departures, min group size
4. **Pickup & Drop-off** - Map locations + list (multiple points)
5. **Highlights** - Activity tags (hiking, beach, historical, food)
6. **Itinerary** - Day-by-day breakdown with times & activities
7. **Inclusions & Exclusions** - What's covered, what's not
8. **Pricing & Policies** - Per-person cost, group discounts, refund policy
9. **Media Upload** - Images, videos (min 5 photos)
10. **Add-ons** - Optional extras (guide upgrade, meals, activities)
11. **Special Notes & Safety** - Health requirements, weather warnings
12. **Compliance & Disclaimers** - Insurance, liability, terms
13. **Preview Listing** - Final check before publishing
14. **Publish** - Gated by provider verification status

---

## 🔒 Security & Compliance

### Request Validation
```
1. All inputs validated via class-validator
2. Whitelist mode enabled (forbid unknown properties)
3. HTML sanitization on text inputs
4. File uploads: Signed URLs + MIME validation
5. Rate limiting: Tiered by user type
```

### Rate Limits
| Endpoint | Guest | User | Provider | Admin |
|----------|-------|------|----------|-------|
| Login | 3/5min | - | - | - |
| General API | 10/min | 100/min | 500/min | ∞ |
| Sensitive (refund, dispute) | - | 5/min | 5/min | 10/min |

### Error Handling
```typescript
{
  statusCode: 400,
  message: "Validation failed",
  error: "Bad Request",
  timestamp: "2025-01-15T10:30:00Z",
  path: "/v1/bookings",
  requestId: "req-12345-abc", // Tracing
  details: {
    // Validation errors with field names
    availableDates: "Date must be in future"
  }
}
```

---

## 🔧 Development Environment

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose

### Quick Start
```bash
# Install dependencies
pnpm install

# Start services (Docker)
docker-compose up -d

# Run migrations
pnpm migration:run

# Start backend
cd backend && pnpm dev  # port 4100

# Start web portal
cd web && pnpm dev      # port 4000
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/tripavail
REDIS_URL=redis://localhost:6379
MEILI_URL=http://localhost:7700
STRIPE_SECRET_KEY=sk_test_...
CORS_ORIGINS=http://localhost:4000
JWT_SECRET=your-secret-key
```

---

## 📊 Monitoring & Observability

### Health Checks
```
GET /v1/health              # Basic liveness
GET /v1/health/ready        # Full readiness (DB, Redis, Meilisearch)
```

### Audit Logging
All state-changing actions logged:
- Provider verification approval/rejection
- Admin actions (suspend, unsuspend, approve property)
- Refund decisions
- Dispute resolutions
- Payout initiations

### Request Tracing
Every request includes:
- `X-Request-ID` header (unique per request)
- Structured JSON logging (timestamp, userId, action, result)
- 30-day retention in PostgreSQL

---

## 🎯 Deployment Phases

### Phase 1: MVP (Now)
- ✓ Provider onboarding & verification
- ✓ Hotel packages (template-based)
- ✓ Tour package builder (14 steps)
- ✓ Booking state machine (QUOTE → HOLD → PAYMENT → CONFIRMED)
- ✓ Mock payment processing
- ✓ Search & discovery (Meilisearch)

### Phase 2: Production Payments
- Real Stripe integration & webhooks
- Refund workflow
- Ledger & payout batches
- Dispute escalation
- Invoice generation

### Phase 3: Scale & Optimization
- Multi-region deployment
- OpenSearch (replace Meilisearch)
- Promotions & discount codes
- Multi-currency support
- Advanced analytics dashboard

---

## 🚨 Common Pitfalls (Avoid These!)

❌ **Re-computing past booking prices** → Use snapshots  
❌ **Publishing without verification checks** → Always gate on approval status  
❌ **Blocking HTTP on side effects** → Queue all async work  
❌ **Missing idempotency keys** → Risk double-holds, double-charges  
❌ **Trusting client-side prices** → Always server-side validate  
❌ **Manual inventory adjustments** → Use transactions, never raw SQL  
❌ **Forgetting audit logs** → Log ALL admin actions & state changes  
❌ **Suspending providers mid-booking** → Isolate suspension from active bookings  

---

## 📚 Additional Resources

- [Provider Onboarding Flow](ONBOARDING_FLOW_MAP.md)
- [Hotel Manager Integration](HOTEL_MANAGER_FLOWS_INTEGRATION.md)
- [Tour Package Builder Steps](hotel_manager_package_creation_10_steps.md)
- [Booking State Machine](ENGINEERING_DECISIONS.md#booking-state-machine)
- [Admin Panel Implementation](ADMIN_PANEL_IMPLEMENTATION.md)

---

**Last Updated:** January 15, 2025  
**Version:** 2.0 (Complete Flow Architecture)
