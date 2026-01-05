# WEEK 2: Database Schema & OpenAPI Codegen

**Duration:** Day 6-10 (31 Dec 2025 - 4 Jan 2026)  
**Goal:** Complete database schema, set up OpenAPI code generation, first CRUD endpoints  
**Team:** 2 backend devs + 1 junior  
**Status:** 🟠 PENDING

---

## Week 2 Objectives

✅ Complete Prisma schema for all core entities (users/provider/auth updates)  
✅ Run all migrations successfully  
✅ Set up OpenAPI code generation  
✅ Create shared DTOs for Web + API  
✅ First REST endpoints with Swagger docs (OTP auth + partner start/me)  
✅ Database indexing strategy documented  
✅ Health check endpoints working

### Scope Updates (Week 2)

- Default user role is **TRAVELER**; keep role unchanged when becoming a partner.
- Add nullable unique `phone`/`email` with `phoneVerified`/`emailVerified` to `User`; remove `HOST`/`TOUR_OPERATOR` roles (capabilities via provider profile).
- Add `auth_otp` table for OTP start/verify.
- Provider profile: `providerType (HOTEL_MANAGER|TOUR_OPERATOR)`, `verificationStatus (NOT_STARTED|IN_PROGRESS|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED|SUSPENDED)`.
- Add `provider_onboarding` table: `providerId`, `currentStep`, `completedSteps JSON`, `submittedAt`, `approvedAt`, `rejectedAt`.
- Endpoints to deliver this week:
  - `POST /v1/auth/start`, `POST /v1/auth/verify` (issue tokens + upsert traveler), `POST /v1/auth/refresh`, `GET /v1/me`.
  - `POST /v1/partners/start` (create provider_profile if missing), `GET /v1/partners/me` (list profiles/statuses).
  - Publishing gate (future): require `provider_profile.verificationStatus == APPROVED`.

---

## 📅 Daily Breakdown

### Day 6 (Mon 31 Dec): Core Database Schema (Part 1)

**Morning (2.5 hours)**

- [ ] Review blueprint entity list and map to Prisma models
- [ ] Implement soft-delete pattern (`deletedAt` field) for critical models
- [ ] Expand `prisma/schema.prisma` with core entities (users/auth/provider)

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Users & Auth
model User {
  id            String   @id @default(uuid())
  email         String?  @unique
  phone         String?  @unique
  passwordHash  String?
  firstName     String?
  lastName      String?
  role          UserRole @default(TRAVELER)
  emailVerified Boolean  @default(false)
  phoneVerified Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime? // For soft deletes

  @@index([email])
  @@index([phone])
  @@index([role])
}

enum UserRole {
  TRAVELER
  ADMIN
}

// Providers
model ProviderProfile {
  id                  String              @id @default(uuid())
  userId              String
  providerType        ProviderType
  verificationStatus  VerificationStatus  @default(NOT_STARTED)
  onboardingStep      Int                 @default(1)
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@unique([userId, providerType])
  @@index([verificationStatus])
}

enum ProviderType {
  HOTEL_MANAGER
  TOUR_OPERATOR
}

enum VerificationStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  SUSPENDED
}
```

- [ ] Add Listings & Rooms models

```prisma
model Listing {
  id            String        @id @default(uuid())
  providerId    String
  name          String
  type          String
  address       String
  city          String
  latitude      Float
  longitude     Float
  description   String        @db.Text
  status        ListingStatus @default(DRAFT)
  checkInTime   String
  checkOutTime  String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  rooms         Room[]

  @@index([providerId])
  @@index([status])
  @@index([city])
}

enum ListingStatus {
  DRAFT
  PUBLISHED
  PAUSED
  ARCHIVED
}

model Room {
  id          String   @id @default(uuid())
  listingId   String
  name        String
  capacity    Int
  bedConfig   String
  basePrice   Decimal
  totalUnits  Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  inventory   InventoryNight[]

  @@index([listingId])
}
```

**Afternoon (2 hours)**

- [ ] Add Booking models

```prisma
model Booking {
  id              String        @id @default(uuid())
  userId          String
  providerId      String
  productType     String        // STAY, HOTEL_PACKAGE, TOUR_PACKAGE
  productId       String
  status          BookingStatus @default(QUOTE)
  checkIn         DateTime?
  checkOut        DateTime?
  guests          Int
  priceSnapshot   Json
  idempotencyKey  String?       @unique
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId])
  @@index([providerId])
  @@index([status])
  @@index([idempotencyKey])
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

model InventoryNight {
  id              String   @id @default(uuid())
  roomId          String
  date            DateTime @db.Date
  totalUnits      Int
  availableUnits  Int
  basePrice       Decimal
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([roomId, date])
  @@index([date])
}
```

- [ ] Add auth_otp and provider_onboarding models

```prisma
model AuthOtp {
  id         String   @id @default(uuid())
  target     String
  channel    String   // phone|email
  purpose    String   // login
  code       String
  expiresAt  DateTime
  attempts   Int      @default(0)
  consumedAt DateTime?
  createdAt  DateTime @default(now())

  @@index([target, channel])
}

model ProviderOnboarding {
  id             String   @id @default(uuid())
  providerId     String
  currentStep    Int      @default(1)
  completedSteps Json?
  submittedAt    DateTime?
  approvedAt     DateTime?
  rejectedAt     DateTime?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([providerId])
}
```

- [ ] Create migration

```bash
npx prisma migrate dev --name add_core_entities
```

**End of Day**

- [ ] Schema compiles without errors
- [ ] Migration created and applied
- [ ] Commit: `feat(database): add core entities schema`

---

### Day 7 (Tue 1 Jan): Core Database Schema (Part 2)

**Morning (2.5 hours)**

- [ ] Add Hotel Packages schema

```prisma
model HotelPackage {
  id              String          @id @default(uuid())
  providerId      String
  listingId       String
  templateId      String
  name            String
  description     String          @db.Text
  status          PackageStatus   @default(DRAFT)
  pricePerPerson  Decimal
  inclusions      String[]
  exclusions      String[]
  availabilityRule String          // WEEKEND_ONLY, SEASONAL, FLEXIBLE
  publishedAt     DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([providerId])
  @@index([listingId])
  @@index([status])
}

enum PackageStatus {
  DRAFT
  PUBLISHED
  PAUSED
  ARCHIVED
}
```

- [ ] Add Tour Packages schema

```prisma
model TourPackage {
  id              String        @id @default(uuid())
  providerId      String
  tripType        String
  name            String
  description     String        @db.Text
  duration        Int           // days
  status          PackageStatus @default(DRAFT)
  basePrice       Decimal
  maxSeats        Int
  publishedAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  itinerary       ItineraryDay[]
  pickups         Pickup[]
  departures      TourDeparture[]

  @@index([providerId])
  @@index([status])
}

model ItineraryDay {
  id          String   @id @default(uuid())
  packageId   String
  day         Int
  title       String
  description String   @db.Text
  createdAt   DateTime @default(now())

  @@index([packageId])
}

model Pickup {
  id          String   @id @default(uuid())
  packageId   String
  city        String
  location    String
  latitude    Float
  longitude   Float
  createdAt   DateTime @default(now())

  @@index([packageId])
}

model TourDeparture {
  id              String   @id @default(uuid())
  packageId       String
  departureDate   DateTime
  availableSeats  Int
  status          String
  createdAt       DateTime @default(now())

  @@unique([packageId, departureDate])
  @@index([departureDate])
}
```

**Afternoon (2.5 hours)**

- [ ] Add Payments & Ledger schema

```prisma
model Payment {
  id              String   @id @default(uuid())
  bookingId       String
  amount          Decimal
  currency        String   @default("USD")
  provider        String   @default("STRIPE")
  providerTxnId   String?
  status          String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([bookingId])
  @@index([provider])
}

model LedgerEntry {
  id          String   @id @default(uuid())
  bookingId   String?
  type        String   // DEBIT, CREDIT
  account     String   // TRAVELER, PROVIDER_EARNINGS, COMMISSION
  amount      Decimal
  currency    String
  description String
  createdAt   DateTime @default(now())

  @@index([bookingId])
  @@index([account])
  @@index([createdAt])
}
```

- [ ] Create migration

```bash
npx prisma migrate dev --name add_packages_and_payments
```

- [ ] Document indexing strategy

```typescript
// docs/DATABASE.md
# Database Indexing Strategy

## Mandatory Indexes (Day 1)
- [ ] users.email (UNIQUE - enforced)
- [ ] users.role
- [ ] listings.providerId
- [ ] listings.status
- [ ] bookings.userId
- [ ] bookings.providerId
- [ ] bookings.status

## Performance Indexes (Before MVP)
- [ ] inventory_nights.date (range queries)
- [ ] bookings.idempotencyKey (unique)
- [ ] tour_departures.departureDate (range)

## Composite Indexes (Phase 2)
- [ ] (providerId, status) on listings
- [ ] (roomId, date) on inventory_nights (UNIQUE)
```

**End of Day**

- [ ] All schema migrations applied
- [ ] Database contains all tables
- [ ] Indexes documented
- [ ] Commit: `feat(database): add packages and payment schema`

---

### Day 8 (Wed 2 Jan): OpenAPI Code Generation Setup

**Morning (2.5 hours)**

- [ ] Install OpenAPI codegen tools

```bash
pnpm add -D @openapitools/openapi-generator-cli @openapi-ts/openapi-typescript
```

- [ ] Create OpenAPI generation script in backend

```typescript
// backend/src/openapi.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function createOpenAPIDocument(app: any) {
  const config = new DocumentBuilder()
    .setTitle('TripAvail API')
    .setDescription('Two-sided travel marketplace API')
    .setVersion('1.0')
    .addBearerAuth()
    .addServer('http://localhost:4100', 'Development')
    .addServer('https://api.tripavail.com', 'Production')
    .build();

  return SwaggerModule.createDocument(app, config);
}
```

- [ ] Update `main.ts` to generate OpenAPI spec on startup

```typescript
import { createOpenAPIDocument } from './openapi';
import fs from 'fs';

async function bootstrap() {
  // ... existing code ...

  if (process.env.GENERATE_OPENAPI === 'true') {
    const document = createOpenAPIDocument(app);
    fs.writeFileSync('openapi.json', JSON.stringify(document, null, 2));
    console.log('OpenAPI spec generated: openapi.json');
  }

  await app.listen(4100);
}
```

**Afternoon (2 hours)**

- [ ] Create shared DTOs package

```bash
mkdir -p shared/src/dtos
```

- [ ] Create user DTOs

```typescript
// shared/src/dtos/user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 12 })
  @MinLength(12)
  password: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;
}
```

- [ ] Create booking DTOs

```typescript
// shared/src/dtos/booking.dto.ts
export class CreateBookingQuoteDto {
  @ApiProperty()
  productType: 'STAY' | 'HOTEL_PACKAGE' | 'TOUR_PACKAGE';

  @ApiProperty()
  productId: string;

  @ApiProperty()
  checkIn: string; // ISO date

  @ApiProperty()
  checkOut?: string;

  @ApiProperty()
  guests: number;
}

export class BookingHoldDto {
  @ApiProperty()
  bookingId: string;

  @ApiHeader({ name: 'Idempotency-Key' })
  idempotencyKey: string;
}
```

**End of Day**

- [ ] OpenAPI spec generates without errors
- [ ] Visit `http://localhost:4100/api-json` → spec visible
- [ ] Shared DTOs created
- [ ] Commit: `feat(api): add openapi documentation setup`

---

### Day 9 (Thu 3 Jan): First Controllers & Endpoints

**Morning (3 hours)**

- [ ] Create Health controller

```typescript
// backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  @ApiOkResponse()
  check(): { status: string; timestamp: Date } {
    return { status: 'ok', timestamp: new Date() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check - all dependencies' })
  @ApiOkResponse()
  async ready(): Promise<{ status: string; services: Record<string, string> }> {
    return {
      status: 'ready',
      services: {
        database: 'ok',
        redis: 'ok',
        meilisearch: 'ok',
      },
    };
  }
}
```

- [ ] Add to app.module

```typescript
import { HealthController } from './health/health.controller';

@Module({
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] Create Users controller (stub)

```typescript
// backend/src/users/users.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateUserDto, UserResponseDto } from '@shared/dtos/user.dto';

@ApiTags('Users')
@Controller('v1/users')
export class UsersController {
  @Post()
  @ApiOperation({ summary: 'Create new user' })
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    // TODO: Implement in Week 3
    return {} as UserResponseDto;
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(): Promise<UserResponseDto> {
    // TODO: Implement in Week 3
    return {} as UserResponseDto;
  }
}
```

**Afternoon (2 hours)**

- [ ] Test endpoints with Swagger UI

```bash
# Verify Swagger is accessible
curl http://localhost:4100/api

# Test health endpoint
curl http://localhost:4100/health
```

- [ ] Create integration test scaffold

```typescript
// backend/src/health/health.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return ok status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
  });
});
```

- [ ] Run test

```bash
pnpm test health.controller.spec.ts
```

**End of Day**

- [ ] Swagger UI shows all endpoints
- [ ] Health endpoints return 200
- [ ] Tests passing
- [ ] Commit: `feat(api): add health and users controllers`

---

### Day 10 (Fri 4 Jan): Documentation & Week 2 Wrap-up

**Morning (2 hours)**

- [ ] Update API.md documentation

```markdown
# API Documentation

## Base URL

- Development: http://localhost:4100
- Production: https://api.tripavail.com

## API Versioning

All endpoints prefixed with `/v1`

## Health Endpoints

- GET /health - Liveness check
- GET /health/ready - Readiness check

## Authentication

(Coming Week 3)

## Rate Limiting

See ENGINEERING_DECISIONS.md for rate limit rules
```

- [ ] Create DATABASE.md

```markdown
# Database Documentation

## Schema Overview

[Include diagram here]

## Entities

- User: Travelers, providers, admins
- ProviderProfile: Provider information
- Listing: Hotel properties
- Room: Room types
- Booking: All booking records
- InventoryNight: Room-night availability
- HotelPackage: Templated hotel packages
- TourPackage: Tour operator packages

## Indexing Strategy

[Documented above]

## Migrations

All schema changes via Prisma migrations
Never manual SQL edits
```

**Afternoon (2 hours)**

- [ ] Create SETUP.md for developers

```markdown
# Local Development Setup

## Prerequisites

- Node.js 20.x
- pnpm 8.x
- Docker Desktop

## First Time Setup

1. Clone repo
2. pnpm install
3. docker-compose up -d
4. cd backend && npx prisma migrate deploy
5. pnpm dev

## Useful Commands

- pnpm lint - Run linter
- pnpm test - Run tests
- pnpm dev - Start dev servers
- npx prisma studio - Open database GUI
```

**Status Review:**

- [ ] All tasks from Week 1 still passing
- [ ] Database schema complete
- [ ] Swagger/OpenAPI working
- [ ] First controllers responding
- [ ] Documentation updated
- [ ] All tests passing
- [ ] Code review checklist:
  - [ ] All files pass linter
  - [ ] No console.log() statements
  - [ ] Error handling on all endpoints
  - [ ] Swagger docs on all endpoints

**Final Commit:**

```bash
git commit -m "docs: complete week 2 setup and documentation"
git push origin develop
```

---

## 📋 Week 2 Completion Checklist

**Database** ✅

- [ ] All core entities modeled
- [ ] Migrations applied successfully
- [ ] Indexes created
- [ ] Database accessible via Prisma Studio

**API Contracts** ✅

- [ ] Swagger UI running
- [ ] DTOs created for Users and Bookings
- [ ] First endpoints documented
- [ ] OpenAPI spec generates

**Controllers** ✅

- [ ] Health controller working
- [ ] Users controller stubbed
- [ ] All endpoints return proper responses

**Testing** ✅

- [ ] Health tests passing
- [ ] Test scaffold created
- [ ] Jest configured

**Documentation** ✅

- [ ] API.md created
- [ ] DATABASE.md created
- [ ] SETUP.md created

---

## 🚀 Week 2 Success Criteria

**All must be true:**

1. ✅ `pnpm test` passes all tests
2. ✅ `pnpm lint` zero errors
3. ✅ http://localhost:4100/api accessible
4. ✅ http://localhost:4100/health returns 200
5. ✅ All migrations applied
6. ✅ Database schema matches Prisma
7. ✅ Shared DTOs created
8. ✅ Documentation up to date

---

**Week Status:** 🟠 PENDING  
**Estimated Completion:** 4 Jan 2026  
**Next:** [WEEK_3.md](WEEK_3.md) - Authentication & RBAC
