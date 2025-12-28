# TripAvail Developer Setup - Enterprise-Grade Improvements

## Current Setup Analysis vs. Airbnb/Booking.com Standards

### ✅ What's Good (Already Matches Industry Standards)

1. **pnpm** - Excellent choice (faster, more efficient than npm/yarn)
2. **Docker Compose** - Standard for local development
3. **Port separation** - Web (3100) and API (4100) is clean
4. **Migration-based schema** - Industry standard
5. **Background jobs (BullMQ)** - Correct approach for async operations

### ⚠️ Critical Gaps (What Top Companies Add)

---

## 1. Enhanced Required Software Stack

```yaml
Core Runtime:
  - Node.js: 20.x LTS (specify exact LTS, not just 20+)
  - pnpm: 8.x or higher
  - Docker Desktop: 24.x+ with Compose V2
  - Git: 2.40+

Language & Type Safety:
  - TypeScript: 5.x (strict mode enabled)
  - Prisma: 5.x (type-safe ORM with migrations)

Development Tools:
  - VS Code: Latest (with recommended extensions)
  - Postman or REST Client: API testing
  - TablePlus or pgAdmin: Database GUI
  - Redis Insight: Redis debugging

Code Quality:
  - ESLint: NestJS + Next.js configs
  - Prettier: Code formatting
  - Husky: Git hooks for pre-commit/pre-push
  - lint-staged: Run linters on staged files only

Testing:
  - Jest: Unit & integration tests
  - Supertest: API endpoint testing
  - Playwright: E2E tests for web
  - Artillery or k6: Load testing

Monitoring (Local Dev):
  - BullBoard: Job queue dashboard
  - Prisma Studio: Database GUI
  - OpenAPI UI: Interactive API docs
```

---

## 2. Complete Docker Compose Setup (Production-Ready)

**Missing from current setup:**

```yaml
services:
  # Current: postgres, redis, meilisearch
  # Add these:

  mailhog:
    # Email testing in development
    image: mailhog/mailhog
    ports:
      - '1025:1025' # SMTP
      - '8025:8025' # Web UI

  minio:
    # S3-compatible local storage
    image: minio/minio
    ports:
      - '9000:9000' # API
      - '9001:9001' # Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"

  bullboard:
    # Job queue monitoring dashboard
    # Built into NestJS app - expose at /admin/queues

  postgres-test:
    # Separate test database
    image: postgres:16
    environment:
      POSTGRES_DB: tripavail_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5433:5432' # Different port to avoid conflicts

  adminer:
    # Lightweight database GUI (alternative to pgAdmin)
    image: adminer
    ports:
      - '8080:8080'

  redis-commander:
    # Redis GUI (alternative to Redis Insight)
    image: rediscommander/redis-commander
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - '8081:8081'
```

**Complete Port Map:**

```
3100 - Web (Next.js)
4100 - API (NestJS)
5432 - Postgres (main)
5433 - Postgres (test)
6379 - Redis
7700 - Meilisearch
8025 - MailHog UI
8080 - Adminer (DB GUI)
8081 - Redis Commander
9000 - MinIO API
9001 - MinIO Console
```

---

## 3. Critical Missing Engineering Rules

### 3.1 Type Safety (Like Airbnb/Stripe)

```typescript
// RULE: Shared types between frontend and backend
// Create: packages/shared/types/

// Bad ❌
// Backend returns { userId: string }, frontend expects { user_id: string }

// Good ✅
// Shared DTOs with code generation
export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
}

// Backend (NestJS)
@Get('me')
async getProfile(): Promise<UserDTO> { }

// Frontend (Next.js)
const user = await apiClient.get<UserDTO>('/auth/me');
```

**RULE:** Use OpenAPI code generation to auto-generate frontend types from backend DTOs.

```bash
# Generate types from OpenAPI spec
pnpm run openapi:generate
```

---

### 3.2 API Contract Testing (Booking.com Standard)

**RULE:** Every API endpoint must have:

1. OpenAPI/Swagger documentation
2. Request/response examples
3. Automated contract tests

```typescript
// contracts/booking.contract.spec.ts
describe('POST /v1/bookings/hold', () => {
  it('matches OpenAPI schema', async () => {
    const response = await request(app).post('/v1/bookings/hold').send(validPayload);

    expect(response).toMatchSchema('HoldBookingResponse');
  });
});
```

---

### 3.3 Database Best Practices (Stripe Level)

**Missing rules to add:**

```yaml
Database Rules:
  Migrations:
    ✅ Use migrations only (already in blueprint)
    ➕ Add migration linting (detect dangerous operations)
    ➕ Require migration review in PRs
    ➕ Add rollback tests for every migration
    ➕ Never deploy without successful migration dry-run

  Indexes:
    ➕ Index all foreign keys
    ➕ Composite indexes for common queries
    ➕ Analyze query plans before production
    ➕ Monitor slow query logs

  Constraints:
    ➕ Use database-level constraints (NOT NULL, UNIQUE, FK)
    ➕ Add check constraints for enum-like columns
    ➕ Use database triggers sparingly (prefer app logic)

  Transactions:
    ✅ Use for inventory locking (already in blueprint)
    ➕ Set isolation levels explicitly (READ COMMITTED default)
    ➕ Keep transactions short (< 100ms)
    ➕ Never nest transactions without savepoints

  Connection Pooling:
    ➕ Configure max connections (Prisma default: 10 per instance)
    ➕ Set connection timeout (30s)
    ➕ Use connection pooler (PgBouncer) in production
```

---

### 3.4 Error Handling (Airbnb Pattern)

**RULE:** Consistent error responses across all endpoints

```typescript
// All errors follow this structure
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId: string;  // ➕ Add for tracing
  details?: unknown;  // Optional validation errors
}

// Example
{
  "statusCode": 400,
  "message": "Insufficient inventory",
  "error": "INVENTORY_UNAVAILABLE",
  "timestamp": "2025-12-25T10:30:00Z",
  "path": "/v1/bookings/hold",
  "requestId": "req_abc123",
  "details": {
    "roomId": "room_123",
    "requestedUnits": 5,
    "availableUnits": 2
  }
}
```

**RULE:** Every error must be logged with context for debugging.

---

### 3.5 Idempotency (Stripe Standard)

**Current:** Idempotency keys on hold/payment endpoints ✅

**Missing:** Broader idempotency strategy

```typescript
// RULE: All POST/PATCH endpoints must support idempotency keys
@Post()
@UseInterceptors(IdempotencyInterceptor)
async createBooking(
  @Headers('idempotency-key') idempotencyKey: string,
  @Body() dto: CreateBookingDto,
) {
  // If duplicate key, return cached response (don't re-execute)
}

// Store idempotency keys in Redis with 24h TTL
// Include status code, body, and timestamp
```

---

### 3.6 Rate Limiting (Booking.com Defense)

**Missing from blueprint:**

```typescript
// RULE: Apply rate limiting to all public endpoints
@Controller('auth')
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per 60 seconds
export class AuthController {
  @Post('login')
  @Throttle(3, 300) // Stricter for login: 3 per 5 min
  async login() {}
}

// Different limits for:
// - Anonymous users: 10 req/min
// - Authenticated users: 100 req/min
// - Providers: 500 req/min
// - Admin: No limit
```

---

### 3.7 Request Validation (Enterprise Level)

**Current:** Strict DTO validation ✅

**Add these rules:**

```typescript
// RULE: Sanitize all string inputs
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

export class CreateListingDto {
  @Transform(({ value }) => sanitizeHtml(value))
  @MaxLength(5000)
  description: string;

  // RULE: Validate nested objects
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  // RULE: Reject unknown properties
  @IsNotEmpty()
  // In main.ts: app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
}
```

---

### 3.8 Logging & Observability (Netflix/Airbnb Level)

**Missing from blueprint:**

```typescript
// RULE: Structured logging with request context
import { Logger } from '@nestjs/common';

class BookingService {
  private readonly logger = new Logger(BookingService.name);

  async holdBooking(dto: HoldBookingDto, requestId: string) {
    this.logger.log({
      message: 'Attempting to hold booking',
      requestId,
      userId: dto.userId,
      productId: dto.productId,
      units: dto.units,
    });

    try {
      const result = await this.lockInventory(dto);

      this.logger.log({
        message: 'Successfully held booking',
        requestId,
        bookingId: result.id,
        duration: Date.now() - start,
      });

      return result;
    } catch (error) {
      this.logger.error({
        message: 'Failed to hold booking',
        requestId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}
```

**Add request tracking:**

```typescript
// middleware/request-context.middleware.ts
import { v4 as uuidv4 } from 'uuid';

export function requestContextMiddleware(req, res, next) {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}
```

---

### 3.9 Testing Standards (Stripe Quality)

**Add these mandatory rules:**

```yaml
Testing Rules:
  Unit Tests:
    - Minimum 70% code coverage
    - Test all business logic in services
    - Mock external dependencies
    - Run in parallel with test database

  Integration Tests:
    - Test all API endpoints
    - Test database transactions and rollbacks
    - Test idempotency behavior
    - Test rate limiting

  E2E Tests (Critical Paths):
    - Complete booking flow (QUOTE → HOLD → CONFIRM)
    - Provider verification workflow
    - Payment success and failure scenarios
    - Refund processing

  Load Tests (Before Production):
    - 100 concurrent holds on same inventory (test locking)
    - 1000 req/sec on search endpoint
    - Hold expiry under load (test job queue)

  Pre-Deployment:
    - All tests must pass
    - No linting errors
    - Migration dry-run successful
    - Build succeeds without warnings
```

---

### 3.10 Security Enhancements (Bank-Grade)

**Missing critical rules:**

```typescript
// RULE: Helmet for security headers
import helmet from 'helmet';
app.use(helmet());

// RULE: CORS configuration (never use wildcard in production)
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});

// RULE: Input sanitization
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsEmail()
  email: string;

  // RULE: Password requirements
  @MinLength(12)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
  password: string;
}

// RULE: Environment variable validation
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(4100),
});

// Fail fast if env vars are invalid
const env = envSchema.parse(process.env);
```

---

## 4. Development Workflow Enhancements

### 4.1 Git Workflow (Airbnb Standard)

```yaml
Branch Strategy:
  main: Production-ready code (protected)
  staging: Integration testing
  develop: Active development
  feature/*: New features
  hotfix/*: Emergency fixes

Rules:
  - No direct commits to main/staging/develop
  - All changes via Pull Requests
  - Minimum 1 code review approval
  - All CI checks must pass
  - Squash commits on merge

Commit Convention:
  Format: 'type(scope): message'
  Types: feat, fix, docs, style, refactor, test, chore
  Example: 'feat(bookings): add hold expiry job'
```

### 4.2 Pre-Commit Hooks (Automated Quality)

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "pnpm test:changed"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## 5. Missing Infrastructure Components

### 5.1 Health Checks (Kubernetes-Ready)

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  async readiness() {
    // Check database connection
    await this.db.query('SELECT 1');

    // Check Redis connection
    await this.redis.ping();

    // Check Meilisearch
    await this.search.health();

    return { status: 'ready' };
  }
}
```

### 5.2 Graceful Shutdown

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable shutdown hooks
  app.enableShutdownHooks();

  // Handle SIGTERM (from Kubernetes/Docker)
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing gracefully...');

    // Stop accepting new requests
    await app.close();

    // Wait for ongoing requests to complete (30s timeout)
    // Close database connections
    // Flush logs

    process.exit(0);
  });
}
```

---

## 6. Documentation Requirements (Missing)

**Add these mandatory docs:**

```
docs/
├── API.md                  # API documentation (auto-generated from OpenAPI)
├── DATABASE.md             # Schema, indexes, query patterns
├── DEPLOYMENT.md           # Deployment procedures, rollback steps
├── MONITORING.md           # Metrics, alerts, dashboards
├── RUNBOOK.md              # Common issues and solutions
├── SECURITY.md             # Security policies, threat model
└── TESTING.md              # Testing strategy, how to run tests
```

---

## 7. CI/CD Pipeline (GitHub Actions)

**Missing from current setup:**

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test:cov
      - run: pnpm build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Final Recommendations

### Priority 1 (Critical - Add Before Writing Code)

1. ✅ TypeScript strict mode
2. ✅ Prisma ORM with type generation
3. ✅ OpenAPI/Swagger documentation
4. ✅ ESLint + Prettier + Husky
5. ✅ Complete Docker Compose (with test DB, MailHog, MinIO)
6. ✅ Request ID tracking and structured logging
7. ✅ Environment variable validation
8. ✅ Error handling middleware
9. ✅ Rate limiting
10. ✅ Health checks

### Priority 2 (Before MVP Launch)

1. ✅ Comprehensive test suite (unit + integration + E2E)
2. ✅ API contract testing
3. ✅ Load testing for booking engine
4. ✅ Security headers (Helmet)
5. ✅ CORS configuration
6. ✅ Idempotency on all mutations
7. ✅ Graceful shutdown
8. ✅ CI/CD pipeline
9. ✅ Database index optimization
10. ✅ Documentation (API, runbooks)

### Priority 3 (Before Scale)

1. ✅ OpenTelemetry tracing
2. ✅ Prometheus metrics
3. ✅ Sentry error tracking
4. ✅ Database connection pooling (PgBouncer)
5. ✅ Redis clustering
6. ✅ CDN for static assets
7. ✅ Multi-region deployment
8. ✅ Feature flags
9. ✅ A/B testing framework
10. ✅ Performance budgets

---

## Comparison: Your Setup vs. Industry Leaders

| Feature        | Current Blueprint         | Airbnb/Booking.com                                    | Status     |
| -------------- | ------------------------- | ----------------------------------------------------- | ---------- |
| Type Safety    | TypeScript                | TypeScript Strict + Generated Types                   | ⚠️ Partial |
| API Contracts  | Swagger                   | OpenAPI + Code Gen + Contract Tests                   | ⚠️ Partial |
| Testing        | Not specified             | 70%+ coverage + E2E + Load                            | ❌ Missing |
| Error Handling | Basic                     | Structured + Request IDs + Tracing                    | ⚠️ Partial |
| Rate Limiting  | Not specified             | Multi-tier + DDoS protection                          | ❌ Missing |
| Observability  | Not specified             | Metrics + Logs + Traces + Alerts                      | ❌ Missing |
| Security       | Basic (RBAC, JWT)         | Helmet + CORS + Input validation + Secrets management | ⚠️ Partial |
| Database       | Migrations + Transactions | + Indexes + Connection pooling + Replicas             | ⚠️ Partial |
| CI/CD          | Not specified             | Automated tests + Deploy previews + Rollbacks         | ❌ Missing |
| Documentation  | Not specified             | API docs + Runbooks + Architecture diagrams           | ❌ Missing |

**Overall Assessment:**

- Current setup: **60/100** (Good foundation, missing production essentials)
- With improvements: **95/100** (World-class, ready for scale)

---

_This document should be implemented alongside the main blueprint to achieve Airbnb/Stripe-level engineering standards._
