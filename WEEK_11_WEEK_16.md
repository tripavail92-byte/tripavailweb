# WEEKS 11-16: Phase 2 - Advanced Features to Production (Days 51-80)

**Dates:** Mar 3-31, 2026  
**Team:** 1 Senior (lead), 2 Mid-level, 1 Junior (tests)  
**Status:** Post-MVP, production preparation

---

## 📌 Overview

After MVP launch (28 Feb), shift focus to:

- **Week 11:** Search indexing (Meilisearch)
- **Week 12:** Real payments (Stripe) + Admin dashboards
- **Week 13:** Reviews & moderation
- **Week 14:** Support & disputes
- **Week 15:** Observability & performance
- **Week 16:** Production deployment & hardening

---

# WEEK 11: Search Indexing (Days 51-55)

## Goal: Full-text search with Meilisearch

### Day 51-52: Meilisearch Integration

- Install Meilisearch client
- Create indexing job (BullMQ)
- Index all hotel packages
- Index all tour packages
- Test search queries

### Day 53: Faceted Filters

- Implement price range filter
- Implement rating filter
- Implement location filter
- Implement date availability filter

### Day 54: Search API Endpoints

```typescript
GET /v1/search/packages?q=mountain&type=tour&minPrice=100&maxPrice=1000
GET /v1/search/hotels?location=New+York&checkIn=2026-03-15
GET /v1/search/suggestions?q=moun  // Autocomplete
```

### Day 55: Performance & Testing

- Response time < 200ms
- Typo tolerance enabled
- Pagination working
- Integration tests passing

**Deliverable:** Full-text search with 5+ filters, <200ms response

---

# WEEK 12: Real Payments & Admin (Days 56-60)

## Goal: Stripe integration, webhooks, admin dashboard

### Day 56-57: Stripe Integration

```typescript
// Create payment intent
async createPaymentIntent(bookingId: string) {
  const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

  const intent = await stripe.paymentIntents.create({
    amount: booking.totalPrice * 100, // cents
    currency: booking.currency.toLowerCase(),
    metadata: { bookingId },
  });

  return { clientSecret: intent.client_secret };
}

// Handle payment webhook
async handlePaymentWebhook(event: Stripe.Event) {
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const { bookingId } = intent.metadata;

    // Update booking to CONFIRMED
    await this.confirmBooking(bookingId);
  }
}
```

- Store webhook events for audit
- Implement idempotent webhook processing
- Test with Stripe test keys
- Handle payment failures gracefully

### Day 58: Refunds & Cancellations

```typescript
async refundBooking(bookingId: string, reason: string) {
  const booking = await this.prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  // Create refund in Stripe
  const refund = await stripe.refunds.create({
    payment_intent: booking.payment.paymentIntentId,
  });

  // Reverse ledger entries
  const originalEntries = await this.prisma.ledgerEntry.findMany({
    where: { bookingId },
  });

  for (const entry of originalEntries) {
    await this.prisma.ledgerEntry.create({
      data: {
        bookingId,
        type: 'REFUND_PROCESSED',
        debitAccount: entry.creditAccount,
        creditAccount: entry.debitAccount,
        amount: entry.amount,
        description: `Refund: ${reason}`,
      },
    });
  }

  // Update booking status
  await this.prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED_BY_GUEST' },
  });
}
```

### Day 59: Admin Dashboard (Stub)

- Admin analytics (bookings, revenue, users)
- Booking management interface
- Provider verification dashboard
- Dispute management

### Day 60: Testing & Documentation

- Stripe webhook tests (use Stripe CLI)
- Refund flow tests
- Admin dashboard tests
- Production readiness check

**Deliverable:** Real payments working, refunds processed, admin dashboard functional

---

# WEEK 13: Reviews & Moderation (Days 61-65)

## Goal: Review submission, moderation, ratings

### Day 61: Review Model & API

```prisma
model Review {
  id                String    @id @default(uuid())
  bookingId         String    @unique
  booking           Booking   @relation(fields: [bookingId], references: [id])
  userId            String
  user              User      @relation(fields: [userId], references: [id])
  rating            Int       @db.SmallInt // 1-5
  title             String
  content           String    @db.Text
  status            String    @default("PENDING") // PENDING, APPROVED, REJECTED
  moderation_notes  String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([bookingId])
  @@index([status])
}
```

### Day 62: Review Endpoints

```typescript
POST   /v1/reviews                  # Submit review
GET    /v1/packages/:id/reviews    # Get reviews for package
PATCH  /v1/reviews/:id/moderate    # Admin: approve/reject
```

### Day 63: Rating Aggregation

```typescript
async getPackageRatings(packageId: string) {
  const reviews = await this.prisma.review.findMany({
    where: {
      booking: { [packageType === 'HOTEL' ? 'hotelPackageId' : 'tourPackageId']: packageId },
      status: 'APPROVED',
    },
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return {
    avgRating,
    totalReviews: reviews.length,
    distribution: {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      // ...
    },
    reviews: reviews.slice(0, 10), // Show recent
  };
}
```

### Day 64: Moderation Queue

- Admin interface to approve/reject reviews
- Moderation notifications
- Bulk moderation actions

### Day 65: Testing & Launch

- Review submission tests
- Moderation workflow tests
- Rating calculation tests
- Spam detection (future: ML)

**Deliverable:** Reviews fully functional, moderation working, ratings displayed

---

# WEEK 14: Support & Disputes (Days 66-70)

## Goal: Ticket system, dispute resolution

### Day 66: Support Tickets

```prisma
model SupportTicket {
  id              String    @id @default(uuid())
  bookingId       String
  booking         Booking   @relation(fields: [bookingId], references: [id])
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  subject         String
  description     String    @db.Text
  status          String    @default("OPEN") // OPEN, IN_PROGRESS, RESOLVED, CLOSED
  priority        String    @default("MEDIUM") // LOW, MEDIUM, HIGH, URGENT
  assignedTo      String?
  assignee        User?     @relation("assigned_tickets", fields: [assignedTo], references: [id])
  messages        TicketMessage[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([bookingId])
  @@index([status])
  @@index([assignedTo])
}

model TicketMessage {
  id              String    @id @default(uuid())
  ticketId        String
  ticket          SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  message         String    @db.Text
  attachments     String[]
  createdAt       DateTime  @default(now())
}
```

### Day 67: Dispute Resolution

```typescript
async createDispute(bookingId: string, reason: string, evidence: string[]) {
  // Create ticket
  const ticket = await this.prisma.supportTicket.create({
    data: {
      bookingId,
      userId,
      subject: `Dispute: ${reason}`,
      description: `Evidence provided: ${evidence.length} files`,
      priority: 'HIGH',
    },
  });

  // Assign to support team
  await this.assignTicketToSupport(ticket.id);

  // Hold refund for investigation
  const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
  // ... set dispute flag on booking
}
```

### Day 68: Ticket Management

- List tickets (admin)
- Assign tickets
- Status transitions
- Resolution notes

### Day 69: Notifications & Escalation

- Send ticket update notifications
- Auto-escalate old OPEN tickets
- Reminder notifications

### Day 70: Testing & Launch

- Ticket creation tests
- Dispute flow tests
- Escalation logic tests
- Support team workflow tests

**Deliverable:** Full support system, dispute tracking, notifications working

---

# WEEK 15: Observability & Performance (Days 71-75)

## Goal: Sentry, structured logging, performance monitoring

### Day 71: Error Tracking (Sentry)

```typescript
// Initialize Sentry in main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

- All unhandled errors sent to Sentry
- Create Sentry issues for alerts
- Monitor error rates

### Day 72: Structured Logging

```typescript
// Structured logging with Winston
import * as winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log with context
logger.info('Booking created', {
  requestId: req.id,
  bookingId: booking.id,
  userId: req.user.userId,
  amount: booking.totalPrice,
});
```

- All operations logged with request ID
- Searchable JSON format
- Log aggregation (ELK stack optional)

### Day 73: Metrics & Monitoring

- Database query time monitoring
- Redis hit/miss rates
- Payment success rates
- API endpoint latencies

### Day 74: Performance Profiling

- Node.js heap snapshots
- CPU profiling
- Memory usage monitoring
- Database connection pool monitoring

### Day 75: Optimization & Documentation

- Fix slow queries (add indexes if needed)
- Optimize N+1 queries
- Cache frequently accessed data
- Document performance baselines

**Deliverable:** Full observability stack, all metrics tracked, performance baselines documented

---

# WEEK 16: Production Deployment (Days 76-80)

## Goal: Deploy to production, monitoring, hardening

### Day 76: Infrastructure Setup

```bash
# Set up production environment
# - RDS Postgres (managed database)
# - Upstash Redis (managed cache/queue)
# - Meilisearch cloud
# - S3 bucket + CloudFront CDN
# - SendGrid for email
# - Stripe production keys
# - Sentry production DSN
```

### Day 77: Database & Migrations

- Create production database
- Run all migrations
- Set up automated backups
- Test restore process
- Create replication (optional for high availability)

### Day 78: Secrets & Configuration

```bash
# Use environment variables (never hardcode)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=... (rotate on deploy)
STRIPE_SECRET_KEY=... (production key)
SENTRY_DSN=...
SENDGRID_API_KEY=...
```

- All secrets in secure vault
- Rotate credentials regularly
- No secrets in git
- Implement secret rotation policy

### Day 79: Health Checks & Monitoring

```typescript
// Production health check
GET /health → { status: 'ok' }
GET /health/ready → { db: 'ok', redis: 'ok', meilisearch: 'ok' }

// Monitoring
- Sentry alerts on error spike
- PagerDuty for on-call
- CloudWatch alarms on DB CPU/memory
- Dashboard in Grafana/Datadog
```

### Day 80: Launch & Validation

```bash
# Final production deployment
1. Create database backup
2. Run smoke tests in staging
3. Deploy backend (blue-green)
4. Deploy frontend to CDN
5. Verify health checks
6. Monitor error rates for 24 hours
7. Celebrate 🎉
```

- Monitor Sentry for errors
- Monitor API latencies
- Monitor payment success rates
- Manual user testing

**Deliverable:** Production deployed, all systems operational, team trained

---

## 📊 Post-MVP Metrics

| Week | Feature               | Completion | Status |
| ---- | --------------------- | ---------- | ------ |
| 11   | Search Indexing       | Day 55     | 🟠     |
| 12   | Real Payments + Admin | Day 60     | 🟠     |
| 13   | Reviews & Moderation  | Day 65     | 🟠     |
| 14   | Support & Disputes    | Day 70     | 🟠     |
| 15   | Observability         | Day 75     | 🟠     |
| 16   | Production            | Day 80     | 🟠     |

---

## 🎯 Phase 2 Success Criteria

✅ Search working with Meilisearch  
✅ Real payments processed via Stripe  
✅ Refunds and disputes fully functional  
✅ Reviews with moderation queue  
✅ Admin dashboards operational  
✅ Full observability (Sentry, logs, metrics)  
✅ Deployed to production  
✅ Zero critical security issues  
✅ 99.9% uptime SLA ready

---

## 🚀 Future Enhancements (Phase 3+)

**Not in scope for MVP/Phase 2:**

- Multi-language support
- Multi-currency (USD only for now)
- Mobile app (Flutter) - separate project
- OpenSearch (for very large scale)
- PgBouncer for connection pooling
- Caching layer (Redis beyond sessions)
- GraphQL API (REST only for now)
- Webhooks for external integrations
- A/B testing infrastructure
- Recommendation engine (ML)
- Dynamic pricing
- Affiliate program
- Gift cards

---

## 📋 16-Week Execution Summary

| Phase | Weeks | Focus         | Output                     |
| ----- | ----- | ------------- | -------------------------- |
| **1** | 1-2   | Foundation    | Docker, TS, Security, DB   |
| **2** | 3-7   | Core Features | Auth, Onboarding, Packages |
| **3** | 8-10  | Critical Path | Booking engine, Tests, MVP |
| **4** | 11-14 | Advanced      | Search, Payments, Support  |
| **5** | 15-16 | Production    | Observability, Deployment  |

**Total Duration:** 16 weeks  
**Team Size:** 3-4 engineers  
**MVP Launch:** Week 10 (28 Feb 2026)  
**Production Ready:** Week 16 (31 Mar 2026)

---

## ✅ Definition of Done (Each Week)

1. All code committed and pushed
2. All tests passing (70%+ coverage minimum)
3. Swagger/OpenAPI docs updated
4. PR reviewed and merged
5. Security review completed
6. Performance baselines met
7. No critical bugs
8. Documentation updated

---

## 🔴 Stop-the-Line Rules

**Immediately escalate if:**

- Test coverage drops below 70%
- Critical security vulnerability found
- Database data loss incident
- Payment processing failure
- Booking state machine broken
- Inventory locking race condition
- Production outage

**No forward progress until fixed.**

---

**Last Updated:** 25 Dec 2025  
**Execution Starts:** 26 Dec 2025  
**MVP Launch Target:** 28 Feb 2026  
**Production Ready:** 31 Mar 2026  
**Status:** 🟢 ALL DOCUMENTATION COMPLETE
