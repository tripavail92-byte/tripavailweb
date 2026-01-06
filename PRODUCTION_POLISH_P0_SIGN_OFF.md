# Production Polish: Error Tracking & Partner Status Visibility

## Overview
Two high-value, low-effort UI improvements implemented to reduce support burden and clarify partner verification states.

---

## 1. RequestId in Error Toasts

### Changes Made
- **Updated [api-client.ts](web/src/lib/api-client.ts):**
  - Enhanced `ApiError` interface with `requestId?: string` property
  - Extract requestId from server error responses: `error.requestId = (data as { requestId }).requestId`

- **Created [error-utils.ts](web/src/lib/error-utils.ts):**
  ```typescript
  export function formatApiError(error: unknown): string {
    // Returns: "Error message (Request ID: abc123)"
  }
  export function getRequestId(error: unknown): string | null {
    // Returns requestId or null
  }
  ```

- **Updated Error Handling in:**
  - [host/page.tsx](web/src/app/host/page.tsx) — handleResubmit uses `formatApiError()`
  - [admin/providers/page.tsx](web/src/app/admin/providers/page.tsx) — handleApprove/handleReject use `formatApiError()`

### Why This Matters
✅ **Support Debugging:** When a user reports "Something went wrong", they can now provide request ID for instant log lookup  
✅ **User Trust:** Shows the system is tracking the error (not just "generic failure")  
✅ **Zero Privacy Risk:** RequestId is internal tracing only, no sensitive data exposed

### Example Toast
```
❌ Provider is not verified/approved (Request ID: 7bcd7674-9b5f-486c-8621-274ffd25487a)
```

---

## 2. Partner Status Banner Component

### New Component: [PartnerStatusBanner.tsx](web/src/app/components/PartnerStatusBanner.tsx)

Comprehensive partner verification status display:

```
┌─────────────────────────────────────────┐
│ ✅ Approved                  Ready to    │
│ 🏨 Hotel Manager              Publish    │
│                                          │
│ Submitted: Jan 6, 2026                  │
│ Reviewed:  Jan 6, 2026                  │
└─────────────────────────────────────────┘
```

**Features:**
- Status-specific icon + color coding (6 statuses: NOT_STARTED, IN_PROGRESS, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED)
- Provider type badge (🏨 Hotel Manager / 🎒 Tour Operator)
- Submitted & Reviewed dates (formatted: "Jan 6, 2026")
- Full rejection reason in red box (if rejected)
- Action badge: "Ready to Publish" / "Pending Admin" / "Can Resubmit"

### Integration Points

**Host Dashboard Layout:**  
- [host/layout.tsx](web/src/app/host/layout.tsx) — Replaced old VerificationBanner with PartnerStatusBanner  
- Displays in main content area above dashboard sections

**Operator Dashboard Layout:**  
- [operator/layout.tsx](web/src/app/operator/layout.tsx) — Replaced old VerificationBanner with PartnerStatusBanner  
- Displays in main content area above tours/departures

**Host Dashboard Page:**  
- [host/page.tsx](web/src/app/host/page.tsx) — Removed duplicate old verification box  
- Single source of truth: PartnerStatusBanner at top

### Why This Matters
✅ **Reduces Support Tickets:** Answers "Why can't I publish?" instantly  
✅ **Clear Next Steps:** Users see rejection reason + "Can Resubmit" action  
✅ **Transparent Timeline:** Shows when submitted/reviewed (builds confidence during review)  
✅ **Multi-Provider Clarity:** Works for both hotel and tour operators

---

## Implementation Checklist

| Item | File | Status |
|------|------|--------|
| Extract requestId from API errors | web/src/lib/api-client.ts | ✅ Done |
| Create error formatting utilities | web/src/lib/error-utils.ts | ✅ Done |
| Build PartnerStatusBanner component | web/src/app/components/PartnerStatusBanner.tsx | ✅ Done |
| Wire banner to host layout | web/src/app/host/layout.tsx | ✅ Done |
| Wire banner to operator layout | web/src/app/operator/layout.tsx | ✅ Done |
| Remove duplicate verification UI | web/src/app/host/page.tsx | ✅ Done |
| Update error handling in host dashboard | web/src/app/host/page.tsx | ✅ Done |
| Update error handling in admin UI | web/src/app/admin/providers/page.tsx | ✅ Done |

---

## Testing Checklist

```
[ ] Test host dashboard loads with PartnerStatusBanner showing correct status
[ ] Test operator dashboard loads with PartnerStatusBanner showing correct status
[ ] Test rejected provider sees rejection reason in banner
[ ] Test UNDER_REVIEW provider sees "Pending Admin" badge
[ ] Test APPROVED provider sees "Ready to Publish" badge
[ ] Test error toast includes requestId (try invalid network call)
[ ] Test admin approval/rejection updates banner immediately on refresh
[ ] Verify dates format correctly ("Jan 6, 2026" not "1/6/2026")
```

---

## Next Milestone: Airbnb-Level Polish

Suggested follow-ups for truly premium partner experience:

### Publishing Safety Checklist
- Before publish button is enabled, verify:
  - Photos uploaded (min 3)
  - House rules/policies defined
  - Payout method configured
  - Cancellation policy selected

### Provider Notifications
- **Email:** "Your onboarding was approved! You can now publish packages."
- **Email:** "Your submission was rejected. Reason: [rejectionReason]. Click to edit and resubmit."
- **WhatsApp:** (optional) SMS/WhatsApp notification for urgent updates

### Visibility Rules
- Draft packages: Visible only to owner, not searchable
- Published packages: Searchable, visible to all
- Hidden packages: Owner can hide published packages temporarily
- Auto-reindex: Update Meilisearch when status changes

### Partner Success Metrics Dashboard
- Onboarding progress by provider type
- Time to approval (avg, min, max)
- Common rejection reasons
- Provider performance (conversion rate, booking volume)

---

## Code Quality Notes

- ✅ **Type-safe:** Full TypeScript support for ApiError + requestId
- ✅ **Reusable:** formatApiError() works in any component
- ✅ **Accessible:** Color + icon + text for status (not color-only)
- ✅ **Responsive:** Banner adapts to mobile/tablet/desktop
- ✅ **Zero Breaking Changes:** Replaces UI but API contracts unchanged

---

## Support Impact

**Before this PR:**
- User: "Something went wrong"
- Support: "That's vague. Please screenshot."
- Debugging: Manual log search, no correlation

**After this PR:**
- User: "Something went wrong (Request ID: 7bcd7674-9b5f-486c-8621-274ffd25487a)"
- Support: grep -r "7bcd7674-9b5f-486c-8621-274ffd25487a" logs/
- Debugging: 10x faster, full context

---

**Status:** Ready for QA/staging deployment  
**Risk Level:** Very Low (UI-only, no API changes)  
**Testing Required:** Manual smoke test on dev/staging
