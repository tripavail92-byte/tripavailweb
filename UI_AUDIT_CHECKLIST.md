# 🔍 Production UI Audit Checklist
**Date:** January 6, 2026  
**Time Budget:** 2 hours  
**Goal:** Find top 10 worst UI issues (not rebuild everything)

---

## How to Do This Audit

Open production in browser (incognito mode):
- Frontend: https://tripavailweb-web.vercel.app/

Go through EVERY flow as if you're a real user. Rate each issue:
- 🔴 **CRITICAL** - Blocks usage (broken, confusing, ugly AF)
- 🟡 **MEDIUM** - Annoying but usable
- 🟢 **NICE-TO-HAVE** - Polish, not urgent

---

## 1. Homepage / Landing (/)

**Test:**
- [ ] Open https://tripavailweb-web.vercel.app/
- [ ] Does it load fast? (< 2 seconds)
- [ ] Is the purpose clear? (travel marketplace?)
- [ ] Can you find "Become a Partner"?
- [ ] Can you find "Browse Hotels/Tours"?

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## 2. Traveler Discovery (/traveler/discovery)

**Test:**
- [ ] Click "Browse" or go to /traveler/discovery
- [ ] Do listings show up?
- [ ] Are images loading?
- [ ] Can you click into a listing?
- [ ] Does search/filter work?

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## 3. Partner Onboarding - Hotel (/host/onboarding)

**Test:**
- [ ] Click "Become a Partner" → Hotel
- [ ] Go through the entire form
- [ ] Check each step for clarity
- [ ] Look for broken layouts, ugly spacing
- [ ] Try to submit (does validation work?)

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## 4. Partner Onboarding - Tour Operator (/operator/onboarding)

**Test:**
- [ ] Click "Become a Partner" → Tour Operator
- [ ] Go through the form
- [ ] Check layout, spacing, clarity
- [ ] Can you submit successfully?

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## 5. Host Dashboard (/host)

**Test:**
- [ ] After onboarding, go to /host
- [ ] Does PartnerStatusBanner show? (YOUR P0 FEATURE!)
- [ ] Is status clear? (6 states working?)
- [ ] Can you navigate to create listing?
- [ ] Overall layout clean?

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## 6. Admin Panel (/admin/providers)

**Test:**
- [ ] Login as admin (if possible)
- [ ] Go to /admin/providers
- [ ] Can you see provider list?
- [ ] Can you approve/reject?
- [ ] Does ErrorToast show on errors? (YOUR P0 FEATURE!)
- [ ] Can you copy RequestId? (TEST THIS!)

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## 7. Error Handling (Trigger Errors)

**Test:**
- [ ] Try to access protected page without login
- [ ] Try to publish without approval
- [ ] Does ErrorToast appear? (YOUR P0 FEATURE!)
- [ ] Click "Copy" button - does it work?
- [ ] Is requestId visible and copyable?

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## 8. Mobile Responsiveness

**Test:**
- [ ] Open DevTools (F12) → Toggle device toolbar
- [ ] Test iPhone 12/13 size (390px width)
- [ ] Go through: Homepage, Discovery, Onboarding, Dashboard
- [ ] Check for: horizontal scroll, tiny text, broken layouts

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## 9. Loading States

**Test:**
- [ ] Refresh pages and watch loading
- [ ] Do you see skeletons/spinners?
- [ ] Or just blank white screen? (BAD)
- [ ] Are loading states consistent?

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## 10. Typography & Spacing

**Test:**
- [ ] Open any page
- [ ] Are headings too big/small?
- [ ] Is line-height cramped?
- [ ] Is spacing inconsistent (some sections tight, others huge)?
- [ ] Are font sizes wildly different?

**Issues Found:**
```
Priority | Issue | Screenshot/Notes
---------|-------|------------------


```

---

## Summary: Top 10 Worst Issues

After going through all sections, list THE WORST 10 issues:

```
Rank | Priority | Page/Flow | Issue | Est. Fix Time
-----|----------|-----------|-------|---------------
1.   | 🔴       |           |       |
2.   | 🔴       |           |       |
3.   | 🔴       |           |       |
4.   | 🟡       |           |       |
5.   | 🟡       |           |       |
6.   | 🟡       |           |       |
7.   | 🟡       |           |       |
8.   | 🟢       |           |       |
9.   | 🟢       |           |       |
10.  | 🟢       |           |       |
```

---

## Decision Matrix

After filling out the audit:

**If 0-2 CRITICAL issues:** Fix them tomorrow (4 hours), move to Phase 2  
**If 3-5 CRITICAL issues:** Fix them this week (2 days), move to Phase 2  
**If 6+ CRITICAL issues:** Consider 1-week UI sprint, then Phase 2

**Do NOT spend more than 1 week on UI before building payments.**

---

## Next Steps (After Audit)

**Tomorrow:**
1. Review this audit
2. Pick top 5 issues (max 6 hours to fix)
3. Deploy fixes
4. **Start Phase 2: Stripe Connect integration**

**This Week:**
- Mon-Tue: Fix critical UI issues
- Wed-Fri: Payments backend (Stripe Connect)

**Next Week:**
- Refund state machine + Ledger
- UI polish as time allows

---

**START THE AUDIT NOW** → Open https://tripavailweb-web.vercel.app/ in browser
