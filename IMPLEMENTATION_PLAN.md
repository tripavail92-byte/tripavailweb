# TripAvail Web Portal - Implementation Plan

## Project Structure

```
tripavailweb/
├── .github/
│   └── copilot-instructions.md     # AI agent guidance (✓ Created)
├── backend/                         # NestJS API (port 4100)
│   ├── src/
│   │   ├── common/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── rbac/
│   │   ├── providers/
│   │   ├── provider_onboarding/
│   │   ├── kyc/
│   │   ├── listings/
│   │   ├── rooms/
│   │   ├── hotel_packages/
│   │   ├── tour_packages/
│   │   ├── bookings/
│   │   ├── pricing/
│   │   ├── payments/
│   │   ├── refunds/
│   │   ├── ledger/
│   │   ├── payouts/
│   │   ├── messaging/
│   │   ├── notifications/
│   │   ├── reviews/
│   │   ├── support/
│   │   ├── search/
│   │   ├── cms/
│   │   └── analytics/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── web/                             # Next.js portal (port 3100)
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx           # Home
│   │   │   ├── search/            # Search results
│   │   │   ├── stays/[id]/        # Stay details
│   │   │   ├── hotel-packages/[id]/
│   │   │   ├── tour-packages/[id]/
│   │   │   ├── auth/
│   │   ├── (traveler)/
│   │   │   └── dashboard/         # Trips, bookings, reviews
│   │   ├── (provider)/
│   │   │   └── provider/          # Onboarding, packages, bookings
│   │   └── (admin)/
│   │       └── admin/             # Verification, disputes, payouts
│   ├── components/
│   ├── lib/
│   └── package.json
├── shared/                          # Shared types/DTOs
│   └── types/
├── docker-compose.yml              # Postgres, Redis, Meilisearch
├── package.json                    # Workspace root
└── README.md
```

---

## Phase 1: Foundation MVP (Weeks 1-6)

### Week 1: Project Setup & Infrastructure

**Backend:**

- [ ] Initialize NestJS project with modular structure
- [ ] Set up Prisma with Postgres connection
- [ ] Configure environment variables (.env.example)
- [ ] Set up Docker Compose (Postgres, Redis, Meilisearch)
- [ ] Configure ports: API 4100, Postgres 5432, Redis 6379, Meilisearch 7700
- [ ] Add BullMQ for job queues
- [ ] Set up logging (Winston) and error handling
- [ ] Create base DTOs and response wrappers

**Web:**

- [ ] Initialize Next.js 14+ with App Router
- [ ] Configure port 3100 in next.config.js
- [ ] Set up Tailwind CSS + shadcn/ui components
- [ ] Configure TypeScript strict mode
- [ ] Set up API client (fetch wrapper with interceptors)
- [ ] Create layout components (header, footer, nav)

**DevOps:**

- [ ] Create .gitignore for node_modules, .env, dist
- [ ] Set up ESLint + Prettier
- [ ] Create pnpm workspace config
- [ ] Document setup in README.md

---

### Week 2: Auth, Users & RBAC

**Backend Modules:**

- [ ] `auth`: JWT strategy, login/register/refresh endpoints
- [ ] `users`: User CRUD, profile management
- [ ] `rbac`: Roles (Traveler, Host, Tour Operator, Admin), Guards
- [ ] `audit`: Audit log service for admin actions

**Database Schema:**

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  phone         String?
  passwordHash  String
  firstName     String
  lastName      String
  role          Role     @default(TRAVELER)
  emailVerified Boolean  @default(false)
  phoneVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Role {
  TRAVELER
  HOST
  TOUR_OPERATOR
  ADMIN
}
```

**Web Pages:**

- [ ] /auth/login
- [ ] /auth/register
- [ ] /auth/forgot-password
- [ ] Protected route middleware

**API Endpoints:**

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `GET /v1/auth/me`

---

### Week 3: Provider Onboarding (Hotel Property Setup)

**Backend Modules:**

- [ ] `providers`: Provider profile management
- [ ] `provider_onboarding`: Onboarding flow state machine
- [ ] `listings`: Property creation and management
- [ ] `rooms`: Room types, inventory setup

**Database Schema:**

```prisma
model ProviderProfile {
  id                String             @id @default(uuid())
  userId            String             @unique
  businessName      String
  verificationStatus VerificationStatus @default(PENDING)
  onboardingStep    Int                @default(1)
  // ... KYC fields
}

enum VerificationStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  SUSPENDED
}

model Listing {
  id              String   @id @default(uuid())
  providerId      String
  name            String
  type            String   // HOTEL, APARTMENT, VILLA
  address         String
  city            String
  latitude        Float
  longitude       Float
  description     String   @db.Text
  status          ListingStatus @default(DRAFT)
  checkInTime     String
  checkOutTime    String
  // ... amenities, policies
}

model Room {
  id          String @id @default(uuid())
  listingId   String
  name        String // Standard, Deluxe, Suite
  capacity    Int
  bedConfig   String
  basePrice   Decimal
  totalUnits  Int
}
```

**Web Pages:**

- [ ] /provider/onboarding/property-setup (7-step wizard)
  - Step 1: Account verification
  - Step 2: Property basics
  - Step 3: Rooms & inventory
  - Step 4: Amenities
  - Step 5: Policies
  - Step 6: Media upload
  - Step 7: Preview & submit

**API Endpoints:**

- `POST /v1/providers/profile`
- `POST /v1/listings`
- `PATCH /v1/listings/:id`
- `POST /v1/listings/:id/rooms`
- `POST /v1/listings/:id/submit-for-review`

---

### Week 4: Tour Operator Onboarding & Verification

**Backend Modules:**

- [ ] `kyc`: Document upload, verification workflow

**Database Schema:**

```prisma
model KYCDocument {
  id            String   @id @default(uuid())
  providerId    String
  type          String   // LICENSE, TRANSPORT_FITNESS, GUIDE_CREDENTIALS
  fileUrl       String
  status        String   @default(PENDING)
  reviewedBy    String?
  reviewedAt    DateTime?
  rejectionReason String?
}
```

**Web Pages:**

- [ ] /provider/onboarding/operator-setup (6 steps)
  - Business profile, compliance docs, payout setup

**Admin Portal:**

- [ ] /admin/verification-queue
- [ ] /admin/providers/:id/review
- [ ] Approve/reject actions with audit logs

**API Endpoints:**

- `POST /v1/kyc/documents`
- `GET /v1/admin/verification-queue`
- `POST /v1/admin/providers/:id/verify`
- `POST /v1/admin/providers/:id/reject`

---

### Week 5: Hotel Packages (14 Templates)

**Backend Modules:**

- [ ] `hotel_packages`: Package CRUD, template system
- [ ] `hotel_package_templates`: 14 template definitions

**Database Schema:**

```prisma
model HotelPackage {
  id              String   @id @default(uuid())
  providerId      String
  listingId       String   // References property profile
  templateId      String   // e.g., "WEEKEND_GETAWAY"
  name            String
  description     String   @db.Text
  status          PackageStatus @default(DRAFT)
  pricePerPerson  Decimal
  inclusions      String[] // Auto-pulled + custom
  exclusions      String[]
  availabilityRule String  // WEEKEND_ONLY, SEASONAL, FLEXIBLE
  publishedAt     DateTime?
}
```

**Web Pages:**

- [ ] /provider/packages/hotel/create (template selector + builder)
- [ ] /provider/packages (list view with publish toggle)
- [ ] /hotel-packages/[id] (public detail page)

**API Endpoints:**

- `GET /v1/hotel-packages/templates` (returns 14 templates)
- `POST /v1/hotel-packages`
- `PATCH /v1/hotel-packages/:id`
- `POST /v1/hotel-packages/:id/publish` (checks verification gate)

---

### Week 6: Tour Packages (14-Step Builder)

**Backend Modules:**

- [ ] `tour_packages`: Package CRUD, itinerary management
- [ ] `tour_inventory`: Seat management, departures

**Database Schema:**

```prisma
model TourPackage {
  id              String   @id @default(uuid())
  providerId      String
  tripType        String   // ADVENTURE, CULTURAL, etc.
  name            String
  description     String   @db.Text
  duration        Int      // days
  status          PackageStatus @default(DRAFT)
  basePrice       Decimal
  maxSeats        Int
}

model ItineraryDay {
  id          String @id @default(uuid())
  packageId   String
  day         Int
  title       String
  description String @db.Text
}

model Pickup {
  id          String @id @default(uuid())
  packageId   String
  city        String
  location    String
  latitude    Float
  longitude   Float
}

model TourDeparture {
  id              String   @id @default(uuid())
  packageId       String
  departureDate   DateTime
  availableSeats  Int
  status          String
}
```

**Web Pages:**

- [ ] /provider/packages/tour/create (14-step wizard)
- [ ] /tour-packages/[id] (public detail page)

**API Endpoints:**

- `POST /v1/tour-packages` (step 1-2)
- `POST /v1/tour-packages/:id/itinerary` (step 6)
- `POST /v1/tour-packages/:id/pickups` (step 4)
- `POST /v1/tour-packages/:id/publish` (step 14 with gates)

---

## Phase 2: Booking Engine & Payments (Weeks 7-10)

### Week 7: Inventory & Availability

**Backend Modules:**

- [ ] `stay_availability`: Room-night inventory
- [ ] `tour_inventory`: Seat management

**Database Schema:**

```prisma
model InventoryNight {
  id              String   @id @default(uuid())
  roomId          String
  date            DateTime @db.Date
  totalUnits      Int
  availableUnits  Int
  basePrice       Decimal
}

model InventoryHold {
  id          String   @id @default(uuid())
  bookingId   String
  roomId      String?
  tourDepId   String?
  date        DateTime?
  units       Int
  expiresAt   DateTime
  status      String   @default(ACTIVE)
}
```

**API Endpoints:**

- `GET /v1/listings/:id/availability?from=:date&to=:date`
- `GET /v1/tour-packages/:id/departures`

---

### Week 8: Booking State Machine (Core)

**Backend Modules:**

- [ ] `bookings`: State machine, hold logic
- [ ] `pricing`: Quote calculator

**Database Schema:**

```prisma
model Booking {
  id              String   @id @default(uuid())
  userId          String
  providerId      String
  productType     String   // STAY, HOTEL_PACKAGE, TOUR_PACKAGE
  productId       String
  status          BookingStatus @default(QUOTE)
  checkIn         DateTime?
  checkOut        DateTime?
  guests          Int
  priceSnapshot   Json     // Store server-calculated breakdown
  idempotencyKey  String?  @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum BookingStatus {
  QUOTE
  HOLD
  PAYMENT_PENDING
  CONFIRMED
  COMPLETED
  CANCELLED_BY_GUEST
  CANCELLED_BY_PROVIDER
  EXPIRED_HOLD
}
```

**API Endpoints:**

- `POST /v1/bookings/quote` (returns price breakdown)
- `POST /v1/bookings/hold` (locks inventory, returns TTL)
- `POST /v1/bookings/:id/confirm` (after payment)
- `POST /v1/bookings/:id/cancel`

**BullMQ Jobs:**

- [ ] `release-expired-holds` (runs every minute)
- [ ] `booking-confirmed-side-effects` (notifications, indexing)

---

### Week 9: Payments & Refunds

**Backend Modules:**

- [ ] `payments`: Stripe integration (mock mode first)
- [ ] `refunds`: Refund state machine

**Database Schema:**

```prisma
model Payment {
  id              String   @id @default(uuid())
  bookingId       String
  amount          Decimal
  currency        String   @default("USD")
  provider        String   @default("STRIPE")
  providerTxnId   String?
  status          String
  webhookEvents   Json[]   // Store all webhook payloads
}

model Refund {
  id          String   @id @default(uuid())
  bookingId   String
  amount      Decimal
  reason      String
  status      RefundStatus
  processedAt DateTime?
}
```

**API Endpoints:**

- `POST /v1/payments/intent` (create Stripe PaymentIntent)
- `POST /v1/payments/webhook` (Stripe webhook handler)
- `POST /v1/refunds` (initiate refund)

---

### Week 10: Ledger & Payouts

**Backend Modules:**

- [ ] `ledger`: Double-entry accounting
- [ ] `payouts`: Batch processing, statements

**Database Schema:**

```prisma
model LedgerEntry {
  id          String   @id @default(uuid())
  bookingId   String?
  type        String   // DEBIT, CREDIT
  account     String   // TRAVELER, PROVIDER_EARNINGS, PLATFORM_COMMISSION
  amount      Decimal
  currency    String
  description String
  createdAt   DateTime @default(now())
}

model Payout {
  id            String   @id @default(uuid())
  providerId    String
  amount        Decimal
  status        PayoutStatus
  scheduledAt   DateTime?
  processedAt   DateTime?
}
```

**API Endpoints:**

- `GET /v1/providers/earnings`
- `GET /v1/admin/payouts/pending`
- `POST /v1/admin/payouts/batch`

---

## Phase 3: Search, Messaging & Reviews (Weeks 11-14)

### Week 11: Search with Meilisearch

**Backend Modules:**

- [ ] `search`: Indexing queue, search service

**Implementation:**

- [ ] Event listeners on listing/package publish/update
- [ ] BullMQ job to sync to Meilisearch
- [ ] Faceted search with filters (location, price, dates, amenities)

**Web Pages:**

- [ ] /search (unified search with tabs: Stays, Hotel Packages, Tour Packages)
- [ ] Map view + list view toggle

**API Endpoints:**

- `GET /v1/search?q=:query&type=:productType&filters=:json`

---

### Week 12: Messaging (Real-time Chat)

**Backend Modules:**

- [ ] `messaging`: WebSocket gateway, thread management

**Database Schema:**

```prisma
model Thread {
  id          String   @id @default(uuid())
  bookingId   String?
  participants String[] // User IDs
  createdAt   DateTime @default(now())
}

model Message {
  id        String   @id @default(uuid())
  threadId  String
  senderId  String
  content   String   @db.Text
  readAt    DateTime?
  createdAt DateTime @default(now())
}
```

**Web Components:**

- [ ] Chat sidebar in provider/traveler dashboards
- [ ] Real-time message delivery via WebSocket

---

### Week 13: Reviews & Moderation

**Backend Modules:**

- [ ] `reviews`: Review CRUD, moderation queue

**Database Schema:**

```prisma
model Review {
  id          String   @id @default(uuid())
  bookingId   String   @unique
  userId      String
  productType String
  productId   String
  rating      Int      // 1-5
  comment     String?  @db.Text
  status      String   @default(PENDING_MODERATION)
  publishedAt DateTime?
}
```

**API Endpoints:**

- `POST /v1/reviews`
- `GET /v1/admin/reviews/moderate`
- `PATCH /v1/admin/reviews/:id/approve`

---

### Week 14: Support Tickets & Disputes

**Backend Modules:**

- [ ] `support`: Ticket system, dispute resolution

**Database Schema:**

```prisma
model Ticket {
  id          String   @id @default(uuid())
  userId      String
  bookingId   String?
  subject     String
  description String   @db.Text
  status      TicketStatus
  assignedTo  String?
  createdAt   DateTime @default(now())
}

model Dispute {
  id          String   @id @default(uuid())
  bookingId   String
  reason      String
  evidence    String[] // File URLs
  resolution  String?
  resolvedAt  DateTime?
}
```

**Admin Portal:**

- [ ] /admin/tickets
- [ ] /admin/disputes

---

## Phase 4: Scale & Production Readiness (Weeks 15-16)

### Week 15: Observability & Testing

- [ ] Set up Sentry for error tracking
- [ ] Add Prometheus metrics + Grafana dashboards
- [ ] Implement distributed tracing (OpenTelemetry)
- [ ] Write integration tests for critical paths
- [ ] Load test booking engine with concurrent holds

---

### Week 16: Deployment & Launch

- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure production Docker images
- [ ] Set up managed Postgres (AWS RDS / Supabase)
- [ ] Configure Redis cluster
- [ ] Set up CDN for media assets
- [ ] Production environment variables
- [ ] Database backups and restore procedures
- [ ] Launch checklist and rollback plan

---

## Success Criteria

**MVP Launch (Phase 1 Complete):**

- ✅ Providers can onboard and get verified
- ✅ Hotel packages and tour packages can be created and published (gated by verification)
- ✅ Search returns relevant results
- ✅ Bookings can be held and confirmed with mock payments
- ✅ Provider and traveler dashboards functional

**Phase 2 Complete:**

- ✅ Real payment processing (Stripe)
- ✅ Refunds processed correctly with ledger entries
- ✅ Providers can view earnings and payout statements
- ✅ Admin can process payout batches

**Phase 3 Complete:**

- ✅ Full-text search with filters and map view
- ✅ Real-time messaging between travelers and providers
- ✅ Reviews and moderation workflows
- ✅ Support tickets and dispute resolution

---

## Development Best Practices

1. **Always run migrations** - never manually edit schemas
2. **Use idempotency keys** on all booking/payment endpoints
3. **Store price snapshots** at booking confirmation - never recompute
4. **Gate publishing** with verification status checks
5. **Audit log all admin actions** (approve, reject, suspend, payout)
6. **Background jobs for side effects** - don't block HTTP responses
7. **Write tests for state machines** (booking, refund, verification)
8. **Use signed URLs for uploads** - validate MIME types
9. **Never trust client calculations** - server is source of truth
10. **Version the API** - all routes under /v1

---

## Next Steps

1. **Run `pnpm init` in workspace root**
2. **Initialize NestJS backend:** `npx @nestjs/cli new backend`
3. **Initialize Next.js web:** `npx create-next-app@latest web`
4. **Copy docker-compose.yml template and start services**
5. **Set up Prisma and run first migration**
6. **Follow Phase 1 Week 1 checklist**

---

_This plan is based on the TripAvail System Blueprint v1.0 (25 Dec 2025). Adjust timelines based on team size and priorities._
