# Week 9 Quick Reference Card

## 🎯 Core Concepts

### Refunds
- **Policy-based**: Calculates refund % based on days until check-in
- **Snapshot**: Uses cancellation policy from booking confirmation
- **Ledger**: All refunds create double-entry ledger entries
- **States**: PENDING → APPROVED → PROCESSED (or REJECTED/FAILED)

### Payouts
- **Batch-based**: Weekly/monthly aggregation of provider earnings
- **10% Fee**: Platform takes 10% of gross earnings
- **Automatic**: Cron jobs create batches at scheduled times
- **Admin Approval**: Required before transfers are initiated

### Stripe Connect
- **Express Accounts**: Each provider has a Stripe account
- **Transfer API**: Initiates bank transfers during payout processing
- **Webhooks**: Confirms transfer status and handles disputes
- **Reconciliation**: Transfer IDs stored for tracking

---

## 📊 Data Models

```
Booking
├─ bookingId (PK)
├─ cancellationPolicy: "FLEXIBLE" | "MODERATE" | "STRICT" | "NON_REFUNDABLE"
├─ priceSnapshot: { basePrice, tax, commission, total, cancellationPolicy }
└─ status: "CONFIRMED" | "PAYMENT_PENDING" | ...

Refund (1:1 to Booking via unique bookingId)
├─ refundId (PK)
├─ bookingId (UNIQUE FK)
├─ userId: traveler requesting refund
├─ providerId: affected provider
├─ status: "PENDING" | "APPROVED" | "PROCESSED" | "REJECTED" | "FAILED"
├─ refundAmount: calculated server-side
├─ refundPercentage: based on policy + timing
└─ cancellationPolicyApplied: snapshot

PayoutBatch (1:many to PayoutStatement)
├─ batchId (PK)
├─ batchNumber: "PAYOUT-2026-01-001" (unique)
├─ frequency: "WEEKLY" | "MONTHLY"
├─ status: "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
├─ periodStart, periodEnd: date range
├─ providerCount: number of providers
├─ totalAmount: sum of gross earnings
├─ totalFees: 10% of totalAmount
└─ approvedBy, processedBy: admin IDs

PayoutStatement (many:1 to PayoutBatch, many:1 to ProviderProfile)
├─ statementId (PK)
├─ batchId (FK)
├─ providerProfileId (FK)
├─ grossAmount: total earnings for provider
├─ platformFee: 10% deduction
├─ netAmount: grossAmount - platformFee
├─ status: same as batch
├─ transferId: Stripe transfer ID (nullable)
└─ paidAt: when transfer completed

LedgerEntry (double-entry accounting)
├─ debitAccount: "traveler:t1" | "provider:p1" | "platform:..."
├─ creditAccount: opposite side
├─ amount: Decimal value
├─ type: "BOOKING_CHARGE" | "REFUND" | "PAYOUT" | ...
├─ description: human-readable
└─ metadata: { bookingId, refundId, batchId, ... }
```

---

## 🔄 Workflows

### Refund Workflow
```
1. Traveler requests refund
   ↓
   requestRefund() → calculates amount based on cancellation policy
   ↓
   Creates Refund record with status=PENDING
   ↓

2. Admin reviews pending refunds
   ↓
   approveRefund() → status=APPROVED
   ↓

3. System processes refund
   ↓
   processRefund(paymentReversal: "stripe_refund_id")
   ↓
   Creates ledger entries:
   - CREDIT traveler (refund issued)
   - DEBIT provider (earnings reduced)
   ↓
   Status changes to PROCESSED
```

### Payout Workflow
```
1. Cron job triggers (Monday 9 AM or 1st of month)
   ↓
   createPayoutBatch() → creates batch with all providers
   ↓
   Status = PENDING
   ↓

2. Admin reviews batch
   ↓
   approvePayoutBatch() → status = SCHEDULED
   ↓

3. Admin processes batch
   ↓
   processPayoutBatch()
   ↓
   For each statement:
   - Call Stripe API: createTransfer()
   - Store transferId in statement
   - Update statement status to IN_PROGRESS
   ↓

4. Stripe webhooks confirm
   ↓
   transfer.updated → paid
   ↓
   Update statement status to COMPLETED
```

---

## 🔌 API Endpoints Summary

### Refunds (9 endpoints)
```
POST   /v1/refunds/request              # Traveler: request refund
GET    /v1/refunds/:id                  # Get refund details
GET    /v1/refunds/booking/:bookingId   # Get refund for booking
GET    /v1/refunds/my/refunds           # Traveler: list my refunds
POST   /v1/refunds/:id/approve          # Admin: approve refund
POST   /v1/refunds/:id/reject           # Admin: reject refund
POST   /v1/refunds/:id/process          # Internal: process refund
GET    /v1/refunds/admin/pending        # Admin: pending refunds
GET    /v1/refunds/admin/statistics     # Admin: refund stats
```

### Payouts (10 endpoints)
```
POST   /v1/payouts/calculate            # Provider: calculate earnings
POST   /v1/payouts/batches              # Admin: create batch
GET    /v1/payouts/batches              # Admin: list batches
GET    /v1/payouts/batches/:id          # Admin: batch details
POST   /v1/payouts/batches/:id/approve  # Admin: approve batch
POST   /v1/payouts/batches/:id/process  # Admin: process batch
GET    /v1/payouts/my/statements        # Provider: my statements
GET    /v1/payouts/my/statistics        # Provider: earnings stats
GET    /v1/payouts/admin/statistics     # Admin: platform stats
```

### Disputes (6 endpoints)
```
GET    /v1/disputes/:id                 # Get dispute details
GET    /v1/disputes                     # List all disputes
GET    /v1/disputes/status/open         # List open disputes
GET    /v1/disputes/booking/:bookingId  # Get disputes for booking
POST   /v1/disputes/:id/evidence        # Add evidence
GET    /v1/disputes/admin/statistics    # Admin: dispute stats
```

---

## 💰 Financial Calculations

### Refund Amount
```
daysUntilCheckIn = checkInDate - now()

if daysUntilCheckIn >= 1 day:
  refundAmount = totalBookingPrice * policy.refundPercentage

else:
  refundAmount = totalBookingPrice * policy.refundPercentage

platformFeeDeducted = refundAmount * 0.1  # 10%
netRefundAmount = refundAmount - platformFeeDeducted
```

### Provider Earnings
```
Gross = sum of all BOOKING_CHARGE ledger entries where:
        creditAccount = "provider:{providerId}"
        AND createdAt between periodStart and periodEnd

Refunds = sum of all REFUND entries where:
          debitAccount = "provider:{providerId}"
          AND status = PROCESSED

Net Earnings = Gross + Refunds (Refunds are negative)
Platform Fee = Net Earnings * 0.10
Final Payout = Net Earnings - Platform Fee
```

### Ledger Entry Example
```
Booking confirmed for $500:
  DEBIT  traveler:t1          $500
  CREDIT provider:p1          $400
  CREDIT platform:commission  $100

Refund of $400 approved (FLEXIBLE policy):
  DEBIT  platform:refunds     $400
  CREDIT traveler:t1          $400
  
  DEBIT  provider:p1          $320
  CREDIT platform:payouts     $320
```

---

## 🔒 Security Checks

| Check | Location | Purpose |
|-------|----------|---------|
| Booking ownership | `requestRefund()` | Only owner can request |
| Booking state | `requestRefund()` | Only CONFIRMED/PAYMENT_PENDING |
| Admin role | All approve/process | RBAC guard |
| Unique refund | `requestRefund()` | @unique(bookingId) constraint |
| Stripe signature | `handleWebhook()` | Verify webhook authenticity |
| Idempotency | Stripe transfers | Prevent duplicate transfers |

---

## ⚙️ Configuration

### Environment
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PLATFORM_FEE_PERCENTAGE=10
```

### Cron Jobs
```typescript
// Weekly (Monday 9 AM UTC)
@Cron(CronExpression.EVERY_WEEK_MONDAY_AT_9AM)
async createWeeklyPayoutBatch()

// Monthly (1st at 9 AM UTC)
@Cron('0 9 1 * *')
async createMonthlyPayoutBatch()
```

---

## 🧪 Testing

### Run Refund Tests
```bash
pnpm test refunds.integration.spec.ts
```

### Run Payout Tests
```bash
pnpm test payouts.integration.spec.ts
```

### Test Coverage
- ✅ Happy path (request → approve → process)
- ✅ Error cases (invalid state, duplicate)
- ✅ Calculations (refund %, earnings aggregation)
- ✅ Ledger entries (double-entry integrity)

---

## 🚀 Deployment

### Prerequisites
- PostgreSQL running
- Redis running
- Stripe account configured
- Migration applied

### Steps
```bash
# 1. Apply database migration
pnpm prisma migrate deploy

# 2. Build backend
pnpm build

# 3. Run tests
pnpm test refunds.integration.spec.ts payouts.integration.spec.ts

# 4. Start API
pnpm start

# 5. Verify
curl http://localhost:4100/v1/health
```

---

## 📚 Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `refund-calculator.ts` | Policy logic | 180 |
| `refunds.service.ts` | State machine | 390 |
| `refunds.controller.ts` | REST endpoints | 310 |
| `payouts.service.ts` | Batch management | 499 |
| `payouts.controller.ts` | REST endpoints | 280 |
| `stripe-connect.service.ts` | Stripe API | 220 |
| `stripe-webhook.service.ts` | Webhooks | 270 |
| `disputes.service.ts` | Dispute tracking | 200 |
| `disputes.controller.ts` | Dispute endpoints | 160 |

---

## ❓ Common Questions

**Q: How are refunds calculated?**  
A: Server calculates based on cancellation policy snapshot stored in booking. No client-side math trusted.

**Q: When do payouts happen?**  
A: Batches auto-create weekly (Mondays) and monthly (1st). Admin must approve before transfers.

**Q: What if a transfer fails?**  
A: Webhook updates statement status to FAILED with reason. Retry available via reprocess endpoint.

**Q: Can I get a refund anytime?**  
A: No, refund % depends on cancellation policy. FLEXIBLE gives 100% until 24h before, STRICT only gives 25%.

**Q: How do disputes work?**  
A: Chargebacks come via Stripe webhooks. Tracked separately from refunds. Providers can submit evidence.

---

## 🎓 Key Takeaways

1. **Double-entry ledger** = financial integrity
2. **Server-side snapshots** = consistent pricing
3. **Batch payouts** = easier reconciliation
4. **Admin approval** = prevents errors
5. **Webhook webhooks** = real-time updates
6. **RBAC guards** = role-based access

---

**Last Updated:** January 5, 2026  
**Status:** ✅ PRODUCTION READY
