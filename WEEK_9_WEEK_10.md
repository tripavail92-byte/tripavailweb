# WEEK 9-10: Admin Panel + Testing, QA, MVP Launch (Days 41-50)

**Dates:** Feb 17-28, 2026  
**Team:** 1 Senior (test infrastructure), 2 Mid-level (feature tests + admin UI), 1 Junior (admin features)  
**Critical Path:** YES ⚠️

---

## 📌 Week Overview

**Goal:** 
1. Build admin panel (core features: user mgmt, provider verification, disputes)
2. Achieve 70%+ test coverage, load test under production conditions
3. Fix all bugs found, prepare for MVP launch

**Definition of MVP:** Can book stays and tours end-to-end with payment (mock) + admins can manage platform.

---

## WEEK 9: Admin Panel + Testing & QA (Days 41-45)

### Admin Panel Build (Parallel Track)

**Frontend Admin Features:**

1. **Admin Layout & Navigation** (`/admin`)
   - [ ] Create admin route group
   - [ ] Admin header with role badge
   - [ ] Left sidebar navigation (7 sections)
   - [ ] Logout button
   - [ ] Session timeout alert

2. **Dashboard** (`/admin/dashboard`)
   - [ ] System overview cards (users, providers, bookings, revenue)
   - [ ] 7-day booking trend chart
   - [ ] Recent actions feed
   - [ ] Quick stats grid
   - [ ] System health status

3. **User Management** (`/admin/users`)
   - [ ] Table with sorting/filtering
   - [ ] Search by email/name
   - [ ] Status badge (Active/Suspended)
   - [ ] Actions: View, Suspend, Delete (with confirmation)
   - [ ] Bulk select & bulk actions

4. **Provider Management** (`/admin/providers`)
   - [ ] Table with type/verification status filters
   - [ ] KYC approval workflow UI
   - [ ] View provider details modal
   - [ ] Approve/Reject buttons
   - [ ] Suspend/Unsuspend toggle

5. **Disputes** (`/admin/disputes`)
   - [ ] Open tickets table
   - [ ] Priority & status filters
   - [ ] Ticket detail view
   - [ ] Assign to support agent
   - [ ] Add notes & send messages

6. **Basic Audit Log** (`/admin/audit-log`)
   - [ ] Searchable action history
   - [ ] Filter by admin/action/resource
   - [ ] Display: Who, What, When, Result

**Backend Admin Features:**

1. **Admin RBAC Guards**
   - [ ] Create `AdminRole` enum (SUPER_ADMIN, PLATFORM_ADMIN, SUPPORT_AGENT, ANALYST)
   - [ ] Add `adminRole` to User model
   - [ ] Create `@RequireAdminRole()` decorator
   - [ ] Protect all admin endpoints

2. **Audit Logging Service**
   - [ ] Create `AuditLog` entity
   - [ ] Create `AuditLogService` (append-only)
   - [ ] Log all admin actions (user actions coming Week 10)
   - [ ] Query/search audit logs

3. **Admin API Endpoints** (Week 9 stubs, tests Week 10)
   - [ ] `GET /v1/admin/dashboard` (overview stats)
   - [ ] `GET /v1/admin/users` (list with filters)
   - [ ] `DELETE /v1/admin/users/{userId}` (soft delete)
   - [ ] `POST /v1/admin/users/{userId}/suspend` 
   - [ ] `GET /v1/admin/providers` (list with filters)
   - [ ] `POST /v1/admin/providers/{providerId}/approve-kyc`
   - [ ] `POST /v1/admin/providers/{providerId}/suspend`
   - [ ] `GET /v1/admin/disputes` (list)
   - [ ] `PATCH /v1/admin/disputes/{ticketId}` (assign, update status)
   - [ ] `GET /v1/admin/audit-log` (searchable)

**EOD Checklist (Day 45, Fri):**

- [ ] Admin layout built and deployed
- [ ] Dashboard with key metrics working
- [ ] User management CRUD working
- [ ] Provider approval workflow UI
- [ ] Disputes assign/resolve UI
- [ ] Audit log searchable
- [ ] RBAC guards in place
- [ ] All admin actions logged
- [ ] Commit: `feat: add admin panel core (users, providers, disputes)`

---

### Day 41 (Mon, Feb 17): Unit & Integration Tests

**Tasks:**

1. **Set up test infrastructure**

   ```bash
   cd backend
   pnpm add -D jest @types/jest ts-jest
   pnpm add -D supertest @types/supertest
   ```

2. **Create test database setup**

   ```typescript
   // test/setup.ts
   import { PrismaClient } from '@prisma/client';

   const prisma = new PrismaClient();

   beforeAll(async () => {
     // Run migrations on test DB
     await prisma.$executeRawUnsafe(`
       DROP SCHEMA IF EXISTS public CASCADE;
       CREATE SCHEMA public;
     `);
     // Run migrations
   });

   afterAll(async () => {
     await prisma.$disconnect();
   });
   ```

3. **Create test helpers**

   ```typescript
   // test/helpers.ts
   export async function createTestUser(prisma, email = 'test@example.com') {
     return prisma.user.create({
       data: {
         email,
         password: 'hashedPassword',
         roles: ['TRAVELER'],
       },
     });
   }

   export async function createTestProvider(prisma) {
     const user = await createTestUser(prisma);
     return prisma.providerProfile.create({
       data: {
         userId: user.id,
         companyName: 'Test Hotel',
         providerType: 'HOTEL',
         verificationStatus: 'APPROVED',
       },
     });
   }

   export async function createTestHotelPackage(prisma, providerId) {
     return prisma.hotelPackage.create({
       data: {
         providerId,
         template: 'WEEKEND_GETAWAY',
         name: 'Test Package',
         description: 'Test',
         basePrice: new Decimal(100),
         status: 'PUBLISHED',
       },
     });
   }
   ```

4. **Write unit tests for critical services**

   ```bash
   # Run tests
   pnpm test -- --coverage

   # Target output:
   # --------------|----------|----------|----------|----------|
   # File          | % Stmts  | % Branch | % Funcs  | % Lines  |
   # --------------|----------|----------|----------|----------|
   # auth/         |    85.2% |    82.1% |    88.0% |    85.0% |
   # bookings/     |    92.1% |    90.5% |    95.0% |    92.0% |
   # pricing/      |    88.5% |    86.0% |    90.0% |    88.5% |
   # --------------|----------|----------|----------|----------|
   # TOTAL         |    75.3% |    73.2% |    78.0% |    75.1% |
   ```

5. **Continuous integration**

   ```bash
   # Create GitHub Actions workflow
   mkdir -p .github/workflows

   # File: .github/workflows/test.yml
   name: Tests
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       services:
         postgres:
           image: postgres:16
           env:
             POSTGRES_DB: tripavail_test
             POSTGRES_PASSWORD: test
       steps:
         - uses: actions/checkout@v3
         - uses: pnpm/action-setup@v2
         - uses: actions/setup-node@v3
         - run: pnpm install
         - run: pnpm test -- --coverage
         - run: pnpm run lint
   ```

**EOD Checklist:**

- [ ] Test database setup working
- [ ] 70%+ unit test coverage
- [ ] CI/CD pipeline passing
- [ ] Commit: `test: add unit tests and CI setup`

---

### Day 42 (Tue, Feb 18): Integration Tests (Full API)

**Tasks:**

1. **Test all major endpoints**

   ```typescript
   describe('Booking Flow Integration', () => {
     it('should complete full booking flow', async () => {
       // 1. Register user
       const registerRes = await request(app.getHttpServer()).post('/v1/auth/register').send({
         email: 'traveler@test.com',
         password: 'SecurePass123!@#',
         role: 'TRAVELER',
       });
       const userId = registerRes.body.userId;

       // 2. Get hotel packages
       const packagesRes = await request(app.getHttpServer())
         .get('/v1/hotel-packages')
         .set('Authorization', `Bearer ${registerRes.body.accessToken}`);

       expect(packagesRes.status).toBe(200);
       expect(packagesRes.body.length).toBeGreaterThan(0);

       // 3. Create quote
       const quoteRes = await request(app.getHttpServer())
         .post('/v1/bookings/quote')
         .set('Authorization', `Bearer ${registerRes.body.accessToken}`)
         .send({
           packageId: packagesRes.body[0].id,
           packageType: 'HOTEL',
           checkInDate: '2026-03-01',
           checkOutDate: '2026-03-03',
           numberOfGuests: 2,
           numberOfRooms: 1,
         });

       expect(quoteRes.status).toBe(201);
       expect(quoteRes.body.status).toBe('QUOTE');
       expect(quoteRes.body.priceSnapshot).toBeDefined();

       // 4. Hold booking
       const holdRes = await request(app.getHttpServer())
         .post(`/v1/bookings/${quoteRes.body.id}/hold`)
         .set('Authorization', `Bearer ${registerRes.body.accessToken}`);

       expect(holdRes.status).toBe(200);
       expect(holdRes.body.status).toBe('HOLD');

       // 5. Confirm booking
       const confirmRes = await request(app.getHttpServer())
         .post(`/v1/bookings/${quoteRes.body.id}/confirm`)
         .set('Authorization', `Bearer ${registerRes.body.accessToken}`);

       expect(confirmRes.status).toBe(200);
       expect(confirmRes.body.status).toBe('CONFIRMED');

       // 6. Verify ledger
       const ledgerRes = await request(app.getHttpServer())
         .get(`/v1/ledger/bookings/${quoteRes.body.id}`)
         .set('Authorization', `Bearer ${registerRes.body.accessToken}`);

       expect(ledgerRes.body.entries).toHaveLength(3);
     });
   });
   ```

2. **Test error scenarios**

   ```typescript
   describe('Error Handling', () => {
     it('should prevent hold without valid quote', async () => {
       const res = await request(app.getHttpServer())
         .post('/v1/bookings/invalid-id/hold')
         .set('Authorization', `Bearer ${token}`);

       expect(res.status).toBe(404);
     });

     it('should prevent unauthorized access', async () => {
       const res = await request(app.getHttpServer()).get('/v1/users/me');

       expect(res.status).toBe(401);
     });

     it('should reject invalid input', async () => {
       const res = await request(app.getHttpServer())
         .post('/v1/auth/register')
         .send({ email: 'invalid', password: 'short' });

       expect(res.status).toBe(400);
       expect(res.body.message).toContain('validation');
     });
   });
   ```

**EOD Checklist:**

- [ ] All endpoints tested
- [ ] Error scenarios covered
- [ ] All tests passing
- [ ] Commit: `test: add integration tests`

---

### Day 43 (Wed, Feb 19): E2E Tests (Critical Paths)

**Tasks:**

1. **E2E test for booking flow**

   ```bash
   pnpm add -D playwright @playwright/test
   ```

   ```typescript
   // e2e/booking.spec.ts
   import { test, expect } from '@playwright/test';

   test('should complete booking flow', async ({ page }) => {
     // Navigate to app
     await page.goto('http://localhost:3100');

     // Register
     await page.click('button:has-text("Sign Up")');
     await page.fill('input[name="email"]', 'traveler@test.com');
     await page.fill('input[name="password"]', 'SecurePass123!@#');
     await page.click('button:has-text("Register")');

     // Browse packages
     await page.waitForSelector('text=Hotel Packages');
     await page.click('button:has-text("View Details")');

     // Create quote
     await page.click('button:has-text("Check Availability")');
     await page.fill('input[name="checkIn"]', '2026-03-01');
     await page.fill('input[name="checkOut"]', '2026-03-03');
     await page.click('button:has-text("Get Quote")');

     // Hold
     await page.click('button:has-text("Hold This Price")');
     expect(await page.locator('text=Hold confirmed')).toBeVisible();

     // Confirm
     await page.click('button:has-text("Proceed to Payment")');
     await page.click('button:has-text("Confirm Booking")');
     expect(await page.locator('text=Booking confirmed')).toBeVisible();
   });
   ```

2. **Provider onboarding E2E test**
   ```typescript
   // e2e/provider-onboarding.spec.ts
   test('should complete provider onboarding', async ({ page }) => {
     // Register as provider
     await page.goto('http://localhost:3100/provider/signup');
     // ... fill form fields step by step
     // Verify each step saves
   });
   ```

**EOD Checklist:**

- [ ] E2E tests for critical paths
- [ ] E2E tests passing
- [ ] Commit: `test: add e2e tests`

---

### Day 44 (Thu, Feb 20): Load & Stress Testing

**Tasks:**

1. **Install load testing tool**

   ```bash
   pnpm add -D k6 # or Artillery
   ```

2. **Create load test scripts**

   ```typescript
   // load-tests/booking-load.js (k6 script)
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export const options = {
     stages: [
       { duration: '30s', target: 10 }, // Ramp up
       { duration: '1m', target: 100 }, // Stay at 100
       { duration: '30s', target: 0 }, // Ramp down
     ],
     thresholds: {
       http_req_duration: ['p(95)<200'], // 95% under 200ms
       http_req_failed: ['<0.1'], // <0.1% failed
     },
   };

   export default function () {
     const payload = JSON.stringify({
       packageId: 'pkg-1',
       packageType: 'HOTEL',
       checkInDate: '2026-03-01',
       checkOutDate: '2026-03-03',
       numberOfGuests: 2,
       numberOfRooms: 1,
     });

     const res = http.post('http://api:4100/v1/bookings/quote', payload, {
       headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${TOKEN}`,
       },
     });

     check(res, {
       'status is 201': (r) => r.status === 201,
       'has priceSnapshot': (r) => JSON.parse(r.body).priceSnapshot !== null,
     });

     sleep(1);
   }
   ```

3. **Run load tests**

   ```bash
   k6 run load-tests/booking-load.js

   # Target metrics:
   # - 95% response time < 200ms
   # - Failed requests < 0.1%
   # - 100+ concurrent users
   # - No memory leaks
   ```

4. **Concurrency test** (inventory locking)
   ```typescript
   // load-tests/inventory-lock.js
   // - 50 concurrent holds on same 20-seat inventory
   // - Verify exactly 20 succeed, 30 fail
   // - Verify no double-bookings
   ```

**EOD Checklist:**

- [ ] Load test script running
- [ ] Response time < 200ms (p95)
- [ ] Failed requests < 0.1%
- [ ] No memory leaks
- [ ] Concurrency lock test passing
- [ ] Commit: `test: add load and stress tests`

---

### Day 45 (Fri, Feb 21): Bug Fixes & Documentation

**Tasks:**

1. **Review all test failures and fix bugs**

   ```bash
   # If tests failing:
   # 1. Identify root cause
   # 2. Fix in code
   # 3. Re-run test
   # 4. Commit fix
   ```

2. **Create test documentation**

   ```markdown
   # Testing Guide

   ## Running Tests

   pnpm test # All unit tests
   pnpm test:integration # Integration tests
   pnpm test:e2e # E2E tests
   pnpm test:load # Load tests

   ## Coverage Targets

   - Auth: 90%+
   - Bookings: 95%+
   - Pricing: 95%+
   - Overall: 70%+

   ## CI/CD Pipeline

   All tests run on every push.
   PR cannot merge without:

   - 70%+ coverage
   - 0 flaky tests
   - All E2E passing
   ```

3. **Final PR review and merge**

**Week Completion Checklist:**

- [ ] 70%+ test coverage achieved
- [ ] All tests passing (0 flaky)
- [ ] Load tests passing (100+ concurrent)
- [ ] E2E tests passing
- [ ] Concurrency lock test verified
- [ ] CI/CD pipeline working
- [ ] Documentation complete
- [ ] PR merged
- [ ] Commit: `test: complete test suite and QA`

---

## WEEK 10: MVP Launch Preparation (Days 46-50)

### Day 46 (Mon, Feb 24): Final Integration & Smoke Tests

**Tasks:**

1. **Verify all modules integrated**

   ```bash
   # Start full stack
   docker-compose up -d
   pnpm dev # backend & frontend

   # Test:
   # - User registration
   # - Login
   # - Provider onboarding
   # - Package creation
   # - Booking flow
   # - All endpoints returning correct data
   ```

2. **Run smoke tests** (sanity check)
   ```typescript
   // smoke-tests/smoke.spec.ts
   describe('MVP Smoke Tests', () => {
     it('should register user', async () => { ... });
     it('should login user', async () => { ... });
     it('should create hotel package', async () => { ... });
     it('should create tour package', async () => { ... });
     it('should complete booking', async () => { ... });
     it('should list all packages', async () => { ... });
   });
   ```

**EOD Checklist:**

- [ ] All modules loaded without errors
- [ ] Health checks passing
- [ ] Database migrations applied
- [ ] No console errors
- [ ] Smoke tests passing

---

### Day 47 (Tue, Feb 25): Security Audit & Performance Tuning

**Tasks:**

1. **Security review checklist**
   - [ ] No hardcoded secrets
   - [ ] HTTPS enforced in production config
   - [ ] CORS whitelist properly configured
   - [ ] SQL injection prevention (Prisma parameterization)
   - [ ] XSS prevention (input sanitization)
   - [ ] Rate limiting active
   - [ ] RBAC guards on all protected routes
   - [ ] No sensitive data in logs
   - [ ] Passwords hashed (bcrypt 10+ rounds)
   - [ ] Tokens have expiration

2. **Performance tuning**

   ```bash
   # Database indexes
   pnpm run db:analyze # Check slow queries

   # Add indexes if needed:
   # - providerProfile(verificationStatus)
   # - hotelPackage(status)
   # - tourPackage(status)
   # - booking(userId, status)
   # - inventoryNight(roomId, date)
   ```

3. **Optimize response times**
   - API endpoints: < 200ms p95
   - Database queries: < 50ms p95
   - No N+1 queries
   - Use database-level limits

**EOD Checklist:**

- [ ] Security audit completed
- [ ] 0 critical vulnerabilities
- [ ] Response times < 200ms
- [ ] No N+1 queries
- [ ] Indexes optimized

---

### Day 48 (Wed, Feb 26): Deployment Runbook & Documentation

**Tasks:**

1. **Create deployment guide**

   ```markdown
   # Deployment Guide

   ## Pre-deployment

   - [ ] All tests passing
   - [ ] Code review approved
   - [ ] Security audit passed
   - [ ] Performance tests OK
   - [ ] Database migrations ready
   - [ ] Environment variables set

   ## Deployment Steps

   1. Create database backup
   2. Run migrations on production
   3. Deploy backend (blue-green)
   4. Deploy frontend (CDN)
   5. Run smoke tests
   6. Monitor error tracking (Sentry)
   7. Monitor logs (Winston)

   ## Rollback

   If anything fails:

   - Revert code
   - Rollback migrations
   - Restore database
   ```

2. **Create operations runbook**

   ```markdown
   # Operations Runbook

   ## Monitoring

   - Sentry: Error tracking
   - Winston: Structured logs
   - Postgres slow query log
   - Redis memory usage

   ## Common Issues

   ### Database Connection Failing

   - Check DATABASE_URL env var
   - Verify Postgres is running
   - Check network/firewall

   ### High Response Times

   - Check slow query log
   - Check database index usage
   - Check Redis cache hits

   ### Memory Leak

   - Check for unresolved promises
   - Monitor Node process memory
   - Enable heap snapshots
   ```

3. **Create troubleshooting guide**

**EOD Checklist:**

- [ ] Deployment guide complete
- [ ] Runbook complete
- [ ] Troubleshooting guide complete
- [ ] All docs in wiki/docs folder

---

### Day 49 (Thu, Feb 27): Pre-launch QA

**Tasks:**

1. **Final checklist for MVP**

   ```
   Authentication & RBAC
   ✅ User registration
   ✅ Login/logout
   ✅ Token refresh
   ✅ Password reset
   ✅ RBAC guards on endpoints
   ✅ Rate limiting active

   Provider Onboarding
   ✅ 7 steps persisting
   ✅ Verification gate
   ✅ Media upload (signed URLs)
   ✅ Can create packages only after onboarding

   Hotel Packages
   ✅ Create from 14 templates
   ✅ Room auto-population
   ✅ Publishing gate (verification)
   ✅ List all packages (search indexing stub)

   Tour Packages
   ✅ 14-step builder
   ✅ All steps persisting
   ✅ Publishing gate (verification)
   ✅ Itinerary day builder

   Bookings
   ✅ Create quote (price snapshot)
   ✅ Hold (inventory locked, 15 min TTL)
   ✅ Confirm (ledger entries)
   ✅ Cancellation
   ✅ Price never changes after confirm
   ✅ Idempotency on holds/confirms

   Search & Discovery
   ✅ List packages by type
   ✅ Basic filtering
   ✅ Pagination

   API & Documentation
   ✅ Swagger docs complete
   ✅ All endpoints documented
   ✅ Example requests/responses
   ✅ Error documentation
   ```

2. **Test with real user scenarios**
   - Traveler discovers → books → pays → completes
   - Provider registers → creates package → receives booking → gets paid
   - Admin views analytics

**EOD Checklist:**

- [ ] All MVP checklist items passing
- [ ] Zero critical bugs
- [ ] All happy-path flows working
- [ ] Ready for launch

---

### Day 50 (Fri, Feb 28): Launch Day

**Tasks:**

1. **Final deployment to staging**

   ```bash
   git tag mvp-v1.0.0
   docker build -t tripavail:mvp .
   docker push tripavail:mvp
   # Deploy to staging environment
   # Run final smoke tests
   ```

2. **Create launch announcement**

   ```markdown
   # TripAvail MVP Launch 🎉

   **Launch Date:** 28 Feb 2026

   ## Features Included

   - User authentication & RBAC
   - Provider onboarding (7 steps)
   - Hotel packages (14 templates)
   - Tour packages (14-step builder)
   - Booking engine (QUOTE → HOLD → CONFIRMED)
   - Full API with Swagger docs

   ## Known Limitations

   - Payments are mocked (Week 11 for real payments)
   - Search indexing is stub (Week 11 for Meilisearch)
   - Real-time messaging not included (Week 12)
   - Admin dashboard stub (Week 11)

   ## Next Phase (Phase 2)

   - Real payment processing (Stripe)
   - Full-text search (Meilisearch)
   - Admin dashboards
   - Messaging & notifications
   ```

3. **Celebrate! 🎉**

**MVP Launch Completion Checklist:**

- ✅ Can register user
- ✅ Can onboard provider (7 steps)
- ✅ Can create hotel package (from 14 templates)
- ✅ Can create tour package (14-step builder)
- ✅ Can book and complete payment
- ✅ Can verify inventory locking
- ✅ Can see all Swagger docs
- ✅ All tests passing (70%+)
- ✅ Zero critical bugs
- ✅ Deployed to staging
- ✅ Ready for user testing

---

## 🎯 MVP Success Metrics

| Metric            | Target     | Status |
| ----------------- | ---------- | ------ |
| Test Coverage     | 70%+       | ✅     |
| API Response Time | <200ms p95 | ✅     |
| Concurrent Users  | 100+       | ✅     |
| Zero Flaky Tests  | 100%       | ✅     |
| Security Audit    | 0 critical | ✅     |
| Documentation     | 100%       | ✅     |
| All Swagger Docs  | 100%       | ✅     |
| E2E Tests Passing | 100%       | ✅     |

---

## 🚀 MVP → Phase 2 Transition

**After launch, immediately start:**

**WEEK 11: Search Indexing**

- Meilisearch integration
- Index all packages
- Faceted search filters
- Full-text search with typo tolerance

**WEEK 12: Real Payments & Admin**

- Stripe integration
- Real payment processing
- Webhooks for payment events
- Admin dashboards

**WEEK 13-14: Advanced Features**

- Reviews & ratings
- Real-time messaging (WebSocket)
- Dispute resolution
- Support tickets

---

**Last Updated:** 25 Dec 2025  
**MVP Launch Date:** 28 Feb 2026  
**Status:** 🟢 Ready for execution
