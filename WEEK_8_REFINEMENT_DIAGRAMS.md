# Week 8 Refinement - Visual Diagrams

## 1. Booking State Machine Flow

### Original Design (Incomplete)
```
┌─────────┐
│  QUOTE  │  Create booking, calculate price
└────┬────┘
     │
     ▼
┌─────────┐
│  HOLD   │  Lock inventory (15-min TTL)
│         │  TODO: expire job ❌
└────┬────┘
     │
     ▼
┌─────────┐
│ PAYMENT │  Create Stripe intent
│         │  (Ambiguous model) ⚠️
└────┬────┘
     │
     ▼
┌──────────┐
│CONFIRMED │  Create ledger
│          │  (No policy) ❌
└────┬─────┘
     │
     ▼
┌──────────┐
│COMPLETED │  Done
└──────────┘
```

### Refined Design (Complete)
```
┌─────────┐
│  QUOTE  │  ✅ Create booking, price snapshot
└────┬────┘
     │
     ▼
┌─────────────────────────────────┐
│  HOLD                           │
├─────────────────────────────────┤
│ ✅ Lock inventory (15-min TTL)  │
│ ✅ Set locked_until timestamp   │
│ ✅ Idempotency key              │
└────┬────────────────────────────┘
     │
     ├─→ [HoldExpirationService]
     │   Runs every 5 minutes
     │   └─→ Find: holdExpiresAt < now()
     │   └─→ Release: inventory back to pool
     │   └─→ Update: status = EXPIRED_HOLD
     │   └─→ Notify: send email to guest
     │
     ▼
┌─────────────────────────────────┐
│  PAYMENT (Pre-Auth Flow)        │
├─────────────────────────────────┤
│ ✅ createPaymentIntent()        │
│   └─→ Stripe pre-auth (no $)    │
│ ✅ confirmPaymentIntent()       │
│   └─→ Actually charge card      │
│ ✅ Handle failures              │
│   └─→ Release inventory hold    │
└────┬────────────────────────────┘
     │
     │ [Parallel - Day 38B]
     ├─→ [CancellationPolicyService]
     │   Define 4 policies
     │   └─→ FLEXIBLE (100% until 1 day)
     │   └─→ MODERATE (100% until 7 days, 50% until 3)
     │   └─→ STRICT (100% until 30 days, 50% until 14)
     │   └─→ NON_REFUNDABLE (never)
     │
     ▼
┌──────────────────────────────────┐
│ CONFIRMED                        │
├──────────────────────────────────┤
│ ✅ Update status                 │
│ ✅ Snapshot cancellation policy  │
│    (locked, can't change)        │
│ ✅ Create ledger entries         │
│    (balanced double-entry)       │
│ ✅ Schedule side effects         │
└────┬─────────────────────────────┘
     │
     ▼
┌──────────────────────────────────┐
│ COMPLETED                        │
├──────────────────────────────────┤
│ ✅ Mark as done                  │
│ ✅ Refund Week can read policy   │
│    to calculate refund $         │
└──────────────────────────────────┘
```

---

## 2. Hold Expiration Service Lifecycle

```
Guest books at 10:00 AM
        │
        ├─→ holdExpiresAt = 10:15 AM
        ├─→ locked_until = 10:15 AM
        └─→ status = HOLD
        
Timeline:
        
10:00 ───→ 10:05 ───→ 10:10 ───→ 10:15 ───→ 10:20 ───→ 10:25
  │                                │         │
  └─ Booking HOLD                  │         │
     Inventory LOCKED              │         │
     (15-min TTL)                  │         │
                                   │         │
                            ❌ Hold expires  │
                            ✅ Within window │
                                             │
                                   ✅ Cron job runs
                                   ✅ Release inventory
                                   ✅ Update status = EXPIRED_HOLD
                                   ✅ Send email to guest

Result: Inventory locked for max ~20 minutes
        (15 min TTL + 5 min cron interval)
```

---

## 3. Payment Pre-Auth Flow

```
Guest on checkout page
        │
        ▼
┌─────────────────────────────┐
│ Step 1: Pre-Authorization   │
├─────────────────────────────┤
│ stripe.createPaymentIntent({│
│   amount: 1500,             │
│   confirm: FALSE  ← KEY     │
│ })                          │
└────────┬────────────────────┘
         │
         ├─→ [Bank checks]
         │   └─→ Valid card? ✓
         │   └─→ Sufficient funds? ✓
         │   └─→ No fraud? ✓
         │
         ├─→ Status: requires_confirmation
         └─→ clientSecret returned
         │
         ▼ [Guest clicks "Complete Booking"]
         │
┌─────────────────────────────┐
│ Step 2: Confirmation        │
├─────────────────────────────┤
│ stripe.confirmPaymentIntent(│
│   paymentIntentId           │
│ )                           │
└────────┬────────────────────┘
         │
         ├─→ [Card is CHARGED NOW]
         │   └─→ Customer sees $1500 debit
         │
         ├─→ Status: succeeded
         │
         ▼
┌─────────────────────────────┐
│ Step 3: Booking Confirmed   │
├─────────────────────────────┤
│ Update booking status       │
│ Create ledger entries       │
│ Release payment hold        │
│ Schedule check-in reminder  │
└─────────────────────────────┘


ERROR PATH:

Payment fails during Step 2
        │
        ├─→ Status: failed
        ├─→ Reason: "Card declined"
        │
        ▼
┌─────────────────────────────┐
│ Auto-Cleanup                │
├─────────────────────────────┤
│ Release inventory hold      │
│ Revert booking to QUOTE     │
│ Send "Payment Failed" email │
│ Suggest retry              │
└─────────────────────────────┘
        │
        ▼
Guest can try different card
or abandon booking
(Inventory released for others)
```

---

## 4. Cancellation Policy Decision Tree

```
Booking CONFIRMED
        │
        ├─→ Policy snapshot stored
        │   cancellationPolicy: "FLEXIBLE"
        │
Guest requests CANCELLATION
        │
        ▼
Calculate days until check-in
        │
        ├─→ Check-in: Jan 20
        └─→ Cancel date: Jan 18
            Days remaining: 2 days
        
        ▼
Apply policy rules (FLEXIBLE):
        
        ┌─ 100% refund if ≥ 1 day before
        │   └─→ 2 days ≥ 1 day? YES
        │   └─→ Refund = $1500 (100%)
        │
        ├─ 50% refund if < 1 day before
        │   └─→ Not applicable
        │
        └─ 0% refund after check-in
            └─→ Not applicable

Result: Process refund of $1500

─────────────────────────────────

Policy Examples:

FLEXIBLE:
    ├─ Full refund: ≥ 1 day before
    └─ No refund: < 1 day before

MODERATE:
    ├─ Full refund: ≥ 7 days before
    ├─ 50% refund: 3-6 days before
    └─ No refund: < 3 days before

STRICT:
    ├─ Full refund: ≥ 30 days before
    ├─ 50% refund: 14-29 days before
    └─ No refund: < 14 days before

NON_REFUNDABLE:
    └─ No refund: any time
```

---

## 5. Service Dependencies

### BEFORE (Gaps)
```
BookingController
    │
    ├─→ BookingService
    │   ├─→ createQuote()
    │   ├─→ holdBooking()
    │   ├─→ confirmPayment()
    │   └─→ confirmBooking()
    │
    └─→ PricingService
        └─→ calculatePrice()

❌ No hold expiration handling
❌ No policy service
❌ Refund Week will be blocked
```

### AFTER (Complete)
```
BookingController
    │
    ├─→ BookingService (primary)
    │   ├─→ createQuote()
    │   ├─→ holdBooking()
    │   ├─→ confirmPayment()
    │   └─→ confirmBooking()
    │
    ├─→ PricingService
    │   └─→ calculatePrice()
    │
    ├─→ PaymentService ✅ NEW DETAIL
    │   ├─→ createPaymentIntent()
    │   ├─→ confirmPaymentIntent()
    │   └─→ capturePaymentAtCheckIn()
    │
    └─→ CancellationPolicyService ✅ NEW
        ├─→ calculateRefund()
        ├─→ getPolicyForPackage()
        └─→ listAvailablePolicies()

Background Jobs:
    │
    └─→ HoldExpirationService ✅ NEW
        ├─→ @Cron('*/5 * * * *')
        ├─→ releaseExpiredHolds()
        └─→ notifyGuests()
```

---

## 6. Timeline: Days 36-40

```
        MON           TUE          WED         THU         FRI
        Feb 10        Feb 11       Feb 12      Feb 13      Feb 14

Day 36  ────────────→
│       Quote
│       • Booking model
│       • Price calculation
│       • Snapshot storage
│
│       Expected: ~80% done Day 36
│       Remaining: 20% finish early Day 37
│
├─ Day 37 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─→
│       HOLD + HoldExpirationService
│       • Lock inventory
│       • Set holdExpiresAt
│       • Create cron job
│       • Auto-release logic
│
│       Expected: Full Day 37
│       Concurrency testing: Evening
│
├─ Day 38 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─→
│ ┌─────────────────────────────────┐
│ │ PAYMENT (Pre-Auth)              │
│ │ • Intent creation               │
│ │ • Pre-auth (no charge)          │
│ │ • Confirmation logic            │
│ │ • Error handling                │
│ │                                 │
│ │ Expected: Morning + Afternoon   │
│ └─────────────────────────────────┘
│            ║
│ ┌─────────────────────────────────┐
│ │ Day 38B: Cancellation Policy    │
│ │ (PARALLEL)                      │
│ │ • Create CancellationPolicy     │
│ │ • Seed database                 │
│ │ • calculateRefund() logic       │
│ │ • Tests                         │
│ │                                 │
│ │ Expected: Afternoon             │
│ └─────────────────────────────────┘
│
├─ Day 39 ─ ─ ─ ─ ─→
│       CONFIRMED + Policy Snapshot
│       • Snapshot cancellation policy
│       • Create ledger entries
│       • Balance verification
│
│       Expected: Morning + Afternoon
│       Ledger tests: Evening
│
├─ Day 40 ─ ─ ─ ─ ─→
│       E2E Tests + Documentation
│       • Complete booking flow
│       • Concurrency tests
│       • Policy calculations
│       • API documentation
│
│       Expected: Full day
│       PR review + merge: Evening
│
└─────────→ WEEK 8 COMPLETE ✅

Total Time: 5 days (Day 36-40)
No extension (Day 38B parallel)
```

---

## 7. Risk Reduction Summary

```
                    BEFORE          AFTER
                    ══════          ═════

Inventory Lock      ❌ Permanent    ✅ 20 min max
Status              "Could lock     "Released
                    forever"        automatically"

Refund Policy       ❌ Undefined    ✅ 4 options
Status              "How to calc    "Service ready"
                    refunds?"

Payment Flow        ⚠️ Ambiguous    ✅ Explicit
Status              "3 models,      "Pre-auth
                    no decision"    + capture"

Week 9 Impact       ❌ Blocked      ✅ Unblocked
Status              "Missing        "All ready"
                    prerequisites"

Test Coverage       ✅ 70% target   ✅ 70% target
Status              "Same           "Clearer
                    percentage"     requirements"

Production Ready    65%             95%
                    ⚠️ Gaps         ✅ Complete
```

---

## 8. Critical Path Dependencies

```
Week 8
├─ Day 36: Quote
│  └─ Must be first ✅
│
├─ Day 37: HOLD
│  ├─ Depends on: Quote ✅
│  └─ Blocks: Nothing (parallel work OK)
│
├─ Day 38: PAYMENT
│  ├─ Depends on: HOLD ✅
│  └─ Decision made: Pre-auth ✅
│
├─ Day 38B: Policy (PARALLEL)
│  ├─ Depends on: Nothing (standalone)
│  └─ Blocks: Day 39 (needs snapshot)
│
├─ Day 39: CONFIRMED
│  ├─ Depends on: PAYMENT ✅ + POLICY ✅
│  └─ Blocks: Week 9 refunds ✅
│
└─ Day 40: Tests
   ├─ Depends on: Days 36-39 ✅
   └─ Unblocks: Week 9 ✅

CRITICAL PATH:
Day 36 → Day 37 → Day 38/38B → Day 39 → Day 40
                                        ✅ No blockers for Week 9
```

---

_Visual Diagrams | Week 8 Refinement | January 4, 2026_
