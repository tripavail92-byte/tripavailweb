# Week 8 Refinement - Quick Reference Card

## 3 Critical Additions

### 1️⃣ HOLD EXPIRATION SERVICE
**Why:** Prevent inventory locked forever  
**When:** Run Day 37 in parallel with HOLD endpoint  
**How:** Cron job every 5 minutes
```typescript
// Every 5 min, find bookings where holdExpiresAt < now()
// Release inventory back to available pool
// Update status to EXPIRED_HOLD
// Send "Hold Expired" email to guest
```

---

### 2️⃣ CANCELLATION POLICY ENGINE  
**Why:** Refunds Week needs to calculate amounts  
**When:** Run Day 38B (afternoon of payment day)  
**How:** 4 policies, snapshot at CONFIRMED
```typescript
FLEXIBLE     → 100% refund until 1 day before
MODERATE     → 100% until 7 days, 50% until 3 days  
STRICT       → 100% until 30 days, 50% until 14 days
NON_REFUND   → No refunds after confirmation

// At confirmation: Copy policy into booking
// At cancellation: Use snapshotted policy to calculate refund $
```

---

### 3️⃣ PAYMENT PRE-AUTHORIZATION DECISION
**Why:** Clarify payment timing model  
**When:** Day 38 implementation  
**How:** 3-step flow
```typescript
Step 1: createPaymentIntent() → Stripe pre-auth (no charge)
Step 2: confirmPaymentIntent() → Actually charges card
Step 3: If fails → Release hold, notify guest, return to QUOTE

Status: PRE_AUTHORIZED → CONFIRMED → CAPTURED
```

---

## Timeline (No Extension)

```
Day 36 ─ Quote Creation
       │
Day 37 ─ HOLD + HoldExpirationService
       │
Day 38 ┬─ PAYMENT (Pre-Auth Flow)
       └─ Day 38B: CancellationPolicy (Parallel)
       │
Day 39 ─ CONFIRMED (Snapshot Policy)
       │
Day 40 ─ Tests + Docs
```

**Total:** Still 5 days, Day 38B runs in parallel

---

## Critical Checklist

✅ HoldExpirationService implemented  
✅ CancellationPolicyService implemented  
✅ Payment pre-auth flow decision made  
✅ Both services have tests  
✅ Policies seeded in database  
✅ Day 39 uses snapshotted policies  
✅ No new blocker for Week 9  

---

## Files to Review

1. [WEEK_7_WEEK_8.md](WEEK_7_WEEK_8.md) - Full implementation details
   - Day 37: Line 737-820 (HoldExpirationService)
   - Day 38: Line 1033-1210 (Payment Pre-Auth)
   - Day 38B: Line 1237-1450 (CancellationPolicy)
   - Day 39: Line 1595-1780 (Updated with policy snapshot)

2. [WEEK_8_REFINEMENT_SUMMARY.md](WEEK_8_REFINEMENT_SUMMARY.md) - Full rationale

3. [MASTER_CHECKLIST.md](MASTER_CHECKLIST.md) - Updated task breakdown (Line 182-202)

---

## What Changes for Developers

### Before Week 8
❌ "How do we handle holds that expire?"  
❌ "How do refunds work?"  
❌ "When do we charge the customer?"  

### After Refinement
✅ HoldExpirationService handles expiry  
✅ CancellationPolicyService calculates refunds  
✅ Pre-auth model explicit (not ambiguous)

### Impact
- Week 9: No blocked waiting for clarity
- Refunds Week: Policy engine already built
- Payment Week: No rewrite needed

---

## One-Liner Explanations

**HoldExpirationService:** "Prevents abandoned bookings from locking inventory forever; runs every 5 min"

**CancellationPolicyService:** "Decides how much customer gets back based on when they cancel; 4 policy types"

**Pre-Auth Model:** "Verify funds without charging; charge only after guest confirms"

---

## Risk Reduction

| Risk | Before | After |
|------|--------|-------|
| Inventory locked forever | ❌ No solution | ✅ Auto-release every 5 min |
| Refunds undefined | ❌ No policy system | ✅ 4 policies, calculated |
| Payment timing unclear | ⚠️ 3 options | ✅ Pre-auth + capture chosen |
| Refund Week blocked | ❌ Missing prerequisites | ✅ All ready |

---

## Start Date

**Week 8 Implementation Begins:** February 10, 2026  
**Expected Completion:** February 14, 2026  
**Lead Developer:** Senior Engineer (critical path)

**Ready to code:** Yes ✅

---

_Quick Reference | January 4, 2026 | Ready for Implementation_
