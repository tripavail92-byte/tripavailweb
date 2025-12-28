# TripAvail - Engineering Decision Document (Final)

**Status:** ✅ APPROVED FOR IMPLEMENTATION  
**Date:** 25 Dec 2025  
**Author:** Technical Leadership  
**Scope:** MVP through Phase 2

---

## Executive Summary

Your developer's suggestions are **85-90% correct** and align with industry leaders (Airbnb, Stripe, Booking.com). This document locks those decisions and clarifies what's MVP vs. scale-phase.

**Verdict:** Proceed with confidence. The developer is thinking at the right level.

---

## ✅ TIER 1: APPROVED (Non-Negotiable for MVP)

### Category 1.1: Type Safety & API Contracts

| Decision                                                                   | Status      | Timeline | Notes                       |
| -------------------------------------------------------------------------- | ----------- | -------- | --------------------------- |
| TypeScript strict mode enabled                                             | ✅ APPROVED | Week 1   | No exceptions               |
| OpenAPI/Swagger as source of truth                                         | ✅ APPROVED | Week 1   | Every endpoint documented   |
| OpenAPI → TypeScript code generation                                       | ✅ APPROVED | Week 2   | `pnpm run openapi:generate` |
| Shared DTOs (backend → frontend)                                           | ✅ APPROVED | Week 1   | `packages/shared/types/`    |
| **Why:** Web + Flutter consume same API; need type safety across platforms | —           | —        | Prevents costly mismatches  |

**Implementation checklist:**

- [ ] Enable `strict: true` in `tsconfig.json`
- [ ] Set up `@nestjs/swagger` for OpenAPI generation
- [ ] Configure `openapi-typescript-codegen` in build pipeline
- [ ] Create shared types package
- [ ] Document in API.md that OpenAPI is single source of truth

---

### Category 1.2: Booking Engine Safety

| Decision                                                         | Status      | Timeline | Notes                        |
| ---------------------------------------------------------------- | ----------- | -------- | ---------------------------- |
| Idempotency keys (POST/PATCH)                                    | ✅ APPROVED | Week 8   | See scope limit below        |
| Load testing: 100 concurrent holds                               | ✅ APPROVED | Week 10  | Before MVP launch            |
| Explicit transactions (Postgres)                                 | ✅ APPROVED | Week 8   | Row-level locks on inventory |
| Isolation level: READ COMMITTED                                  | ✅ APPROVED | Week 7   | Set in Prisma migration      |
| Inventory hold tests                                             | ✅ APPROVED | Week 9   | Must pass before publish     |
| **Why:** Double-booking is existential risk; must be bulletproof | —           | —        | One bug = loss of trust      |

**Scope clarification:**

```
IDEMPOTENCY REQUIRED for:
  ✅ POST /v1/bookings/hold
  ✅ POST /v1/bookings/:id/confirm
  ✅ POST /v1/payments/capture
  ✅ POST /v1/payments/webhook (from Stripe)
  ✅ POST /v1/refunds

IDEMPOTENCY NOT REQUIRED for:
  ❌ POST /v1/listings (content updates)
  ❌ PATCH /v1/listings/:id
  ❌ POST /v1/reviews
```

**Implementation checklist:**

- [ ] Create `IdempotencyInterceptor` (stores keys in Redis with 24h TTL)
- [ ] Add idempotency column to bookings table
- [ ] Load test with k6 or Artillery (100 concurrent holds, 50% same inventory)
- [ ] Verify: duplicate request returns cached response (exact timestamp + status code)

---

### Category 1.3: Observability & Debugging

| Decision                                                       | Status      | Timeline | Notes                                 |
| -------------------------------------------------------------- | ----------- | -------- | ------------------------------------- |
| Request ID per request (X-Request-ID)                          | ✅ APPROVED | Week 1   | Use UUID v4 or custom                 |
| Structured logging (JSON format)                               | ✅ APPROVED | Week 1   | Winston or Pino                       |
| Error objects with context                                     | ✅ APPROVED | Week 1   | See format below                      |
| Sentry for error tracking                                      | ✅ APPROVED | Week 2   | Free tier sufficient for MVP          |
| **Why:** Debugging production issues requires full audit trail | —           | —        | Saves weeks of "where did this fail?" |

**Standard error format (mandatory):**

```typescript
{
  statusCode: 400,
  message: "User-friendly message",
  error: "ENUM_ERROR_CODE",  // e.g., INVENTORY_UNAVAILABLE
  timestamp: "2025-12-25T10:30:00Z",
  path: "/v1/bookings/hold",
  requestId: "req_abc123",
  details?: {
    field: "roomId",
    reason: "requested 5 units, only 2 available"
  }
}
```

**Implementation checklist:**

- [ ] Add `RequestContextMiddleware` (injects `requestId` into every request)
- [ ] Configure Winston/Pino with JSON formatting
- [ ] Create `GlobalExceptionFilter` (catches all errors, returns standard format)
- [ ] Add Sentry SDK and test error capture
- [ ] Document: "How to trace a bug using requestId"

---

### Category 1.4: Security Fundamentals

| Decision                                                | Status      | Timeline | Notes                             |
| ------------------------------------------------------- | ----------- | -------- | --------------------------------- |
| Rate limiting (ThrottlerGuard)                          | ✅ APPROVED | Week 1   | See limits below                  |
| Helmet.js security headers                              | ✅ APPROVED | Week 1   | 1 line of code                    |
| CORS: explicit origin whitelist (no `*`)                | ✅ APPROVED | Week 1   | Config from env var               |
| Environment variable validation (Zod)                   | ✅ APPROVED | Week 1   | Fail fast on startup              |
| Input sanitization (HTML, XSS)                          | ✅ APPROVED | Week 2   | sanitize-html + class-transformer |
| **Why:** Baseline expectations for any serious platform | —           | —        | Zero negotiation                  |

**Rate limits (locked):**

```
Anonymous endpoints (login, register):
  3 requests per 5 minutes

Other public endpoints:
  10 requests per minute

Authenticated endpoints:
  100 requests per minute

Provider endpoints:
  500 requests per minute

Admin endpoints:
  No limit (use custom monitoring instead)
```

**Implementation checklist:**

- [ ] Install `@nestjs/throttler`
- [ ] Configure guards with rates above
- [ ] Add Helmet: `app.use(helmet())`
- [ ] Configure CORS with `process.env.ALLOWED_ORIGINS`
- [ ] Add Zod env validation in `config.service.ts`
- [ ] Add `sanitizeHtml` to all string DTOs
- [ ] Test rate limiting with k6 or Artillery

---

### Category 1.5: Database Discipline

| Decision                                                             | Status      | Timeline | Notes                         |
| -------------------------------------------------------------------- | ----------- | -------- | ----------------------------- |
| Migrations only (no manual schema edits)                             | ✅ APPROVED | Week 1   | Non-negotiable                |
| Index all foreign keys                                               | ✅ APPROVED | Week 7   | Before production             |
| Short transactions (< 100ms)                                         | ✅ APPROVED | Week 8   | Code review rule              |
| Explicit isolation levels                                            | ✅ APPROVED | Week 7   | In migration comments         |
| Migration review in PRs                                              | ✅ APPROVED | Week 1   | Require approval before merge |
| **Why:** Database is source of truth; errors here cascade everywhere | —           | —        | One bad migration = data loss |

**Implementation checklist:**

- [ ] Set up Prisma migrations with `prisma migrate dev`
- [ ] Add migration linting: `prisma-lint` or custom script
- [ ] Add PR check: no merge without migration review
- [ ] Document: "List all foreign keys and their indexes"
- [ ] Create script to analyze slow queries (add to CI)

---

### Category 1.6: CI/CD & Git Discipline

| Decision                                 | Status      | Timeline | Notes                                 |
| ---------------------------------------- | ----------- | -------- | ------------------------------------- |
| Protected main branch (PRs only)         | ✅ APPROVED | Week 1   | GitHub settings                       |
| Minimum 1 code review                    | ✅ APPROVED | Week 1   | Require approval before merge         |
| All checks must pass (lint, test, build) | ✅ APPROVED | Week 1   | Blocking CI                           |
| Commit conventions (type/scope)          | ✅ APPROVED | Week 1   | Use commitlint                        |
| Pre-commit hooks (Husky)                 | ✅ APPROVED | Week 1   | Lint + format before commit           |
| Squash on merge                          | ✅ APPROVED | Week 1   | Keeps history clean                   |
| **Why:** Prevents silent quality decay   | —           | —        | "We'll add tests later" never happens |

**Git workflow (locked):**

```
Branch strategy:
  main      ← Production (protected)
  staging   ← Pre-production testing
  develop   ← Integration
  feature/* ← Feature work
  hotfix/*  ← Emergency fixes

Commit format:
  feat(bookings): add hold expiry job
  fix(auth): resolve JWT validation bug
  docs(api): update booking endpoints

Rules:
  ✅ All work via PR
  ✅ No force-push to main
  ✅ Squash commits on merge
  ✅ Delete branch after merge
```

**Implementation checklist:**

- [ ] Set up branch protection in GitHub
- [ ] Install `commitlint` and `husky`
- [ ] Configure `lint-staged` to run on staged files
- [ ] Create `.github/workflows/ci.yml` (test, lint, build)
- [ ] Add GitHub Actions secrets (DB, API keys)

---

## ⚠️ TIER 2: APPROVED WITH ADJUSTMENT

### Category 2.1: Prisma ORM Selection

**Situation:** Developer recommends Prisma 5.x

**Decision:** ✅ APPROVED, but **lock the decision now**

**Why:**

- Prisma: Modern, type-safe, excellent migrations, great DX
- TypeORM: More flexible, but heavier learning curve
- Sequelize: Legacy, less type-safe

**The rule:** Switching ORM mid-project is 10x more expensive than picking right initially.

**Action required:**

```typescript
// Lock this in code:
// File: backend/package.json
{
  "dependencies": {
    "@prisma/client": "^5.8.0"
  }
}

// File: docs/ARCHITECTURE.md
// Document: "ORM: Prisma 5.x (locked, no switches)"
```

**If you want to pivot:** Must happen BEFORE Week 2, not after Week 4.

---

### Category 2.2: Idempotency Scope (Refined)

**Original suggestion:** "All POST/PATCH endpoints must support idempotency"

**Reality check:** This is technically correct but needs scope limit.

**Refined decision:**

```
TIER 1 (CRITICAL):
  ✅ Booking holds
  ✅ Booking confirms
  ✅ Payments
  ✅ Webhooks (Stripe, refunds)

TIER 2 (GOOD TO HAVE, but not MVP-blocking):
  🟡 Profile updates
  🟡 Package edits
  🟡 Listing updates

Rationale: Tier 1 involves money/inventory. Tier 2 is just content.
```

**Timeline:**

- Week 8: Implement Tier 1 (blocking for MVP launch)
- Phase 2: Consider Tier 2 if helpful (but not required)

---

### Category 2.3: Docker Stack (Optional Profile)

**Original suggestion:** Full stack with MailHog, MinIO, Adminer, Redis Commander

**Decision:** ✅ APPROVED as **optional**, split into profiles

**Refine to:**

```yaml
Core (always):
  - Postgres (main)
  - Redis
  - Meilisearch

Optional dev tools (docker-compose.devtools.yml):
  - MailHog (email testing)
  - MinIO (S3 storage)
  - Adminer (DB GUI)
  - Redis Commander (Redis GUI)
  - Postgres test DB
```

**Rationale:**

- Core services are non-negotiable for development
- Dev tools are nice-to-have but slow startup if bundled
- Allow developers to opt-in: `docker-compose -f docker-compose.yml -f docker-compose.devtools.yml up`

---

## 🟡 TIER 3: SCALE-PHASE (Not MVP Blockers)

These are **excellent ideas**, but implement in Phase 2/3, not MVP.

### Deferred to Phase 2+ (After MVP launch)

```
🟡 OpenTelemetry distributed tracing
   → Useful once you have 10+ services
   → Not needed for monolith

🟡 Prometheus + Grafana metrics
   → Required for production monitoring
   → Can use CloudWatch/DataDog on day 1

🟡 PgBouncer connection pooling
   → Needed when Postgres hits limits (100+ connections)
   → Prisma pooling is fine for MVP

🟡 Redis clustering
   → Needed when single Redis bottlenecks
   → Single instance handles 10k req/sec

🟡 Multi-region deployment
   → Phase 3 scale feature
   → Not for MVP

🟡 A/B testing framework
   → Launch after product hits users
   → Not before MVP

🟡 Feature flags at scale
   → Useful for gradual rollouts
   → Start with env vars; upgrade later
```

**Why defer?**

- They add complexity without adding user value before scale
- Better to nail down business logic first
- Can always add later (most are additive)

**When to reconsider:** After MVP launch + initial user testing

---

## 📋 APPROVAL MATRIX (What to Send Developer)

```
WHAT TO DO FIRST (Weeks 1-2) — Don't skip, don't defer

✅ TypeScript strict mode
✅ OpenAPI/Swagger + code generation
✅ Shared types package
✅ Request ID middleware
✅ Structured logging (Winston/Pino)
✅ Helmet + CORS
✅ Rate limiting (rates locked above)
✅ Environment validation (Zod)
✅ Global error handling
✅ Husky + commitlint
✅ GitHub branch protection
✅ Prisma ORM (decision locked)
✅ Basic CRUD tests

WHAT TO DO BEFORE MVP LAUNCH (Weeks 3-10)

✅ Load testing (100 concurrent holds)
✅ Inventory locking under stress
✅ Idempotency for booking/payment
✅ Sentry error tracking
✅ Database indexing
✅ Migration review process
✅ API contract tests
✅ Integration tests (70%+ coverage)

DEFER TO PHASE 2+ (After MVP)

🟡 OpenTelemetry tracing
🟡 Prometheus/Grafana
🟡 PgBouncer
🟡 Redis clustering
🟡 Feature flags (advanced)
🟡 Multi-region
🟡 A/B testing
```

---

## One Thing Your Developer Did VERY WELL

They **implicitly validated** your TripAvail blueprint's core decisions:

✅ HOLD → CONFIRM booking model (correct pattern)  
✅ Event-driven jobs (correct for side effects)  
✅ Separation of onboarding vs packages (prevents data re-entry)  
✅ Test DB isolation (enables parallel testing)  
✅ Web + API contract discipline (required for Web + Flutter)

**This means:** Your architecture is solid. Their suggestions enhance it, they don't contradict it.

---

## Final Message to Developer

Send this:

---

**TO:** Development Team  
**FROM:** Technical Leadership  
**RE:** Engineering Standards Approval  
**DATE:** 25 Dec 2025

Your analysis is **85-90% correct** and aligns with industry leaders. Proceed with confidence.

### APPROVED (Do These):

- TypeScript strict mode
- OpenAPI/Swagger with code generation
- Shared DTOs (Web + Flutter)
- Idempotency on booking/payment (see scope in APPROVAL_MATRIX.md)
- Request IDs + structured logging
- Rate limiting (limits locked)
- Helmet + CORS + Zod validation
- Database migrations + indexing + migration review
- Git workflow (protected branches, PR reviews, pre-commit hooks)
- Load testing booking engine
- Sentry error tracking

### APPROVED WITH SCOPE (Do These, but with limits):

- Prisma ORM (locked, no switches after Week 2)
- Docker dev tools (optional, separate docker-compose.devtools.yml)
- Idempotency (only for money/booking-critical endpoints)

### DEFER (Keep documented, implement Phase 2+):

- OpenTelemetry tracing
- Prometheus/Grafana monitoring
- PgBouncer connection pooling
- Redis clustering
- Multi-region deployment
- A/B testing framework

See attached: **ENGINEERING_DECISIONS.md** (this document) for full details.

---

## Implementation Timeline (16 Weeks)

```
WEEK 1-2 (TIER 1 Setup)
  ✅ TypeScript strict, OpenAPI, Shared types
  ✅ Request ID, logging, error handling
  ✅ Helmet, rate limiting, CORS
  ✅ Zod validation
  ✅ Git workflow + Husky

WEEK 3-7 (Core features + testing)
  ✅ Auth, RBAC, providers
  ✅ Property onboarding
  ✅ Database indexing + migration review

WEEK 8-10 (Booking engine)
  ✅ Holds, confirms, inventory locking
  ✅ Idempotency for critical paths
  ✅ Load testing (100 concurrent holds)
  ✅ API contract tests

WEEK 11-14 (Features + observability)
  ✅ Search, messaging, reviews
  ✅ Sentry setup
  ✅ 70%+ test coverage

WEEK 15-16 (Production readiness)
  ✅ CI/CD finalization
  ✅ Documentation (API, runbooks)
  ✅ Pre-launch testing
```

---

## References

- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) - Full roadmap
- [DEVELOPER_SETUP_IMPROVEMENTS.md](DEVELOPER_SETUP_IMPROVEMENTS.md) - Technical deep dives
- [.github/copilot-instructions.md](.github/copilot-instructions.md) - AI agent guidance

---

**Status:** ✅ APPROVED FOR IMPLEMENTATION  
**Confidence Level:** 95% (well-reasoned, industry-aligned)  
**Risk Level:** Low (improvements are additive, not disruptive)

_This document is the source of truth. Reference it in PRs and code reviews._
