# Admin Panel Roadmap

**Created:** 26 Dec 2025  
**Target Launch:** Week 9 (Jan 27-31, 2026)  
**Status:** Planning Phase

---

## 🎯 Admin Panel Vision

Admins need **complete system visibility and control** to:
- Monitor all users, providers, bookings, transactions
- Verify/suspend/delete providers
- Remove/delete users
- Resolve disputes
- Manage content
- View audit logs of all actions
- Generate reports

---

## 📊 Admin Dashboard (Landing Page)

### System Overview Stats
```
┌─────────────────────────────────────────┐
│         TRIPAVAIL ADMIN DASHBOARD       │
├─────────────────────────────────────────┤
│ Total Users: 1,234 | New Today: 45      │
│ Total Providers: 89 | Pending Approval: 12 │
│ Total Bookings: 5,678 | Revenue: $234K │
│ Disputes Open: 3 | Urgent: 1           │
│                                         │
│ 📈 Last 7 Days Bookings Chart           │
│ 💰 Revenue by Category Pie Chart        │
│ ⚠️  System Health: All Green            │
│ 🔔 Recent Actions Feed                  │
└─────────────────────────────────────────┘
```

### Quick Stats to Show
- Active users (last 30 days)
- Active providers
- Pending verifications
- Open disputes/tickets
- System uptime %
- Database health
- Payment processing status

---

## 👥 User Management

### `/admin/users` - Full User Control

#### View All Users
```
Filters:
- Role: All | Traveler | Hotel Manager | Tour Operator | Support
- Status: All | Active | Suspended | Deleted
- Created: Date Range
- Sort: Name | Email | Created | Last Login

Table Columns:
- Checkbox (select multiple)
- ID / Email
- Name / Phone
- Role(s)
- Status (Active/Suspended)
- Provider Profile (if any)
- Created Date
- Last Login
- Actions Menu
```

#### User Actions (with confirmation dialogs)
- **View Details** → Full profile, all bookings, all transactions
- **Edit Profile** → Change email, phone, name
- **Suspend** → Block from logging in (keeps data)
- **Unsuspend** → Restore access
- **Delete** → Soft delete (anonymize data, keep records for compliance)
- **Force Logout** → Terminate all sessions
- **Assign Support Role** → Make them a support agent
- **View Audit Log** → All actions by/for this user

#### Bulk Actions
- Select multiple users → Suspend all, Delete all, Export CSV

---

## 🏨 Provider Management

### `/admin/providers` - Full Provider Control

#### View All Providers
```
Filters:
- Type: All | Hotel Manager | Tour Operator
- Status: All | Active | Pending Verification | Approved | Rejected | Suspended
- Verification: All | Not Started | In Progress | Submitted | Under Review | Approved
- Region: All | [Dropdown by region]
- Created: Date Range

Table Columns:
- Checkbox (select)
- Business Name / ID
- Type (Hotel/Tour)
- Verification Status (Badge color)
- Provider Status (Active/Suspended)
- KYC Status (% complete)
- Listings Count
- Bookings Count
- Revenue (this month)
- Created Date
- Actions
```

#### Provider Actions (with confirmation)
- **View Profile** → Full onboarding data, all properties, all packages
- **View Properties** → All listings, rooms, inventory
- **View Packages** → All hotel/tour packages
- **View Bookings** → All transactions, revenue
- **Approve KYC** → Move to APPROVED status (unlocks publishing)
- **Reject KYC** → Send back with reason, mark REJECTED
- **Request Resubmission** → Ask for more docs
- **Suspend Provider** → Pause all listings, block publishing
- **Unsuspend** → Restore access
- **Delete Provider** → Remove completely (soft delete, keep audit trail)
- **View Audit Log** → All actions by this provider
- **Send Message** → Notify via email/SMS

#### Provider Verification Workflow
```
Step 1: Initial Review
- Check business license
- Verify identity docs
- Approve/Reject/Request more

Step 2: Property Verification (Hotel Managers)
- Review property details
- Confirm location
- Verify listings count
- Set approval status

Step 3: Final Decision
- Approve (can publish)
- Reject (explain reason)
- Conditional Approval
```

---

## 📋 Booking Management

### `/admin/bookings` - Monitor All Transactions

#### View All Bookings
```
Filters:
- Status: All | QUOTE | HOLD | PAYMENT | CONFIRMED | COMPLETED | CANCELLED | REFUNDED
- Product: All | Hotel | Tour | Stay
- Date Range
- Price Range
- Traveler Email
- Provider Email
- Payment Status: All | Pending | Complete | Failed

Table Columns:
- ID / Confirmation #
- Traveler Name / Email
- Provider / Package Name
- Status (colored badges)
- Total Price / Payment Status
- Created Date
- Check-in Date
- Actions
```

#### Booking Actions
- **View Details** → Full booking breakdown, payment status, invoice
- **View Communication** → Chat between traveler & provider
- **Approve Hold** → Manually confirm hold if stuck
- **Force Complete** → Mark as completed (careful!)
- **Issue Refund** → Partial or full with reason
- **Cancel Booking** → Soft cancel, notify both parties
- **View Audit Trail** → All state changes
- **Investigate Dispute** → Flag for support team

---

## ⚠️ Dispute & Support Management

### `/admin/disputes` - Conflict Resolution

#### View All Disputes
```
Filters:
- Status: Open | In Progress | Resolved | Closed
- Priority: All | Low | Medium | High | Urgent
- Type: Cancellation | Quality | Payment | Safety | Other
- Created: Date Range

Table Columns:
- ID / Ticket #
- Complainant
- Against (Traveler/Provider)
- Type
- Priority (badge)
- Status
- Created / Last Updated
- Assigned To
- Actions
```

#### Dispute Actions
- **View Full Details** → Conversation history, evidence, attachments
- **Assign to Agent** → Assign support staff
- **Change Priority** → Escalate or downgrade
- **Add Internal Note** → Hidden from users
- **Send Message** → Reply to traveler/provider
- **Propose Resolution** → Suggest partial/full refund
- **Force Resolution** → Admin decision (final)
- **Close Ticket** → Archive
- **View Audit** → All interactions

---

## 📝 Content Management

### `/admin/content`

#### Manage Amenities
- View all amenities (hotel & tour)
- Add/Edit/Delete amenities
- Set category (Room, Property, Activity, etc.)
- Toggle active/inactive
- Track usage (how many listings use this)

#### Manage Templates
- View all 14 hotel package templates
- View all tour trip types
- Edit template descriptions
- Add/remove templates
- View usage statistics

#### Manage Categories
- Property types (Hotel, Resort, B&B, etc.)
- Trip types (Adventure, Wellness, etc.)
- Amenity categories
- Edit/add/remove

---

## 🔍 System Monitoring

### `/admin/monitoring` - Health & Performance

#### Real-time Metrics
- Database health (connections, slow queries)
- Redis cache status
- API response times
- Error rate (last hour)
- Meilisearch index sync status
- Payment gateway connectivity

#### Logs & Alerts
- System error logs (searchable)
- Payment webhooks received
- Failed email/SMS deliveries
- Authentication failures
- Rate limit hits

---

## 📊 Audit & Reports

### `/admin/audit-log` - Complete Action History

#### Search All Admin Actions
```
View every admin action:
- Who (admin email)
- What (action type)
- On Whom (user/provider/booking ID)
- When (timestamp)
- Result (success/failure)
- IP Address
- User Agent
```

Filters:
- Admin name
- Action type (create, update, delete, suspend, etc.)
- Resource type (user, provider, booking, etc.)
- Date range
- Result (success/failure)

### `/admin/reports` - Business Intelligence

#### Pre-built Reports
- **Revenue Report** → By provider, by period, by product type
- **Booking Report** → Volume, completion rate, cancellation rate
- **Provider Performance** → Revenue, bookings, ratings
- **User Behavior** → New users, repeat customers, engagement
- **Payment Report** → Transactions, chargebacks, refunds
- **Dispute Report** → Frequency by type, resolution time

#### Export
- CSV download
- PDF generation
- Email reports on schedule

---

## 🔐 Admin Access Control

### Admin Roles (RBAC)

```
┌─────────────────────────────────────────┐
│           ADMIN ROLE HIERARCHY          │
├─────────────────────────────────────────┤
│ SUPER_ADMIN                             │
│  • View everything                      │
│  • Delete anyone/anything               │
│  • Manage all admins                    │
│  • Full system control                  │
│                                         │
│ PLATFORM_ADMIN                          │
│  • View all data                        │
│  • Suspend users/providers              │
│  • Approve verifications                │
│  • Cannot delete (only super admin)     │
│  • Cannot manage other admins           │
│                                         │
│ SUPPORT_AGENT                           │
│  • View users/bookings/disputes         │
│  • Respond to disputes                  │
│  • View audit logs (limited)            │
│  • Cannot delete or suspend             │
│                                         │
│ ANALYST                                 │
│  • View-only access                     │
│  • Reports and dashboards only          │
│  • No action capabilities               │
└─────────────────────────────────────────┘
```

### Permissions Matrix
```
| Action | Super Admin | Platform Admin | Support Agent | Analyst |
|--------|-------------|---|---|---|
| View All Data | ✅ | ✅ | Limited | Limited |
| Delete User | ✅ | ❌ | ❌ | ❌ |
| Delete Provider | ✅ | ❌ | ❌ | ❌ |
| Suspend User | ✅ | ✅ | ❌ | ❌ |
| Suspend Provider | ✅ | ✅ | ❌ | ❌ |
| Approve KYC | ✅ | ✅ | ❌ | ❌ |
| Resolve Disputes | ✅ | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ✅ | Limited | ❌ |
| Manage Admins | ✅ | ❌ | ❌ | ❌ |
| Export Reports | ✅ | ✅ | ✅ | ✅ |
```

---

## 🏗️ Implementation Plan

### Phase 1: Week 9 (Core Admin)
- [ ] Admin layout & navigation
- [ ] `/admin/dashboard` with key metrics
- [ ] `/admin/users` (view, suspend, delete)
- [ ] `/admin/providers` (view, verify, suspend)
- [ ] `/admin/disputes` (basic workflow)
- [ ] RBAC guards & permissions
- [ ] Audit logging on all admin actions

### Phase 2: Week 10 (Advanced Features)
- [ ] `/admin/bookings` (monitoring & intervention)
- [ ] `/admin/content` (manage amenities, templates)
- [ ] `/admin/monitoring` (system health)
- [ ] `/admin/audit-log` (searchable action history)
- [ ] Email notifications to support team
- [ ] Bulk operations (select multiple, action all)

### Phase 3: Week 11+ (Polish & Intelligence)
- [ ] `/admin/reports` (advanced analytics)
- [ ] Scheduled report emails
- [ ] Dashboard widgets customization
- [ ] Advanced filtering & saved searches
- [ ] Admin API documentation
- [ ] Admin user guide

---

## 🔑 Key Database Additions Needed

```typescript
// Admin audit log table
AuditLog {
  id: string
  adminId: string          // Who did it
  action: string           // create_user, delete_provider, etc.
  resourceType: string     // user, provider, booking
  resourceId: string       // ID of affected entity
  changes: JSON            // What changed (before/after)
  status: enum             // success, failure
  reason?: string          // Why (if delete/suspend)
  ipAddress: string
  userAgent: string
  createdAt: DateTime
}

// Admin assignment for tickets
DisputeAssignment {
  ticketId: string
  assignedToAdminId: string
  assignedAt: DateTime
  resolvedAt?: DateTime
}
```

---

## 🚀 Success Criteria

- [x] All admin actions logged with who/what/when/why
- [x] Super admin can delete any user/provider
- [x] Platform admin can suspend/approve
- [x] Support agents can resolve disputes
- [x] Real-time system health visible
- [x] Audit trail unalterable (append-only)
- [x] All actions require confirmation dialogs
- [x] Rate limiting doesn't apply to admins

---

## 📱 Admin Routes Map

```
/admin
├── /dashboard                    [Super, Platform, Support, Analyst]
├── /users                        [Super, Platform]
│   └── /[userId]
├── /providers                    [Super, Platform]
│   └── /[providerId]
├── /bookings                     [Super, Platform, Support]
│   └── /[bookingId]
├── /disputes                     [Super, Platform, Support]
│   └── /[ticketId]
├── /content
│   ├── /amenities               [Super, Platform]
│   ├── /templates               [Super, Platform]
│   └── /categories              [Super, Platform]
├── /monitoring                   [Super, Platform]
├── /audit-log                    [Super, Platform, Support (limited)]
├── /reports                      [Super, Platform, Analyst]
├── /admins                       [Super only]
└── /settings                     [Super only]
```

---

## 🎨 UI Components Needed

- Confirmation dialogs (delete/suspend)
- Status badge system (color-coded)
- Data tables with sorting/filtering
- Search bars (global search)
- Date range pickers
- Multi-select checkboxes
- Bulk action toolbar
- Timeline/activity feeds
- Modal forms (edit profile)
- Toast notifications
- Loading states
- Empty states

---

## 🔒 Security Considerations

- All admin actions require re-authentication
- 2FA for super admins (future)
- IP whitelist option
- Session timeout (30 min inactivity)
- Admin action emails to all super admins
- Immutable audit log (prevent tampering)
- Rate limiting exemption only in protected endpoints
- Encrypt sensitive data in audit logs

---

**Next Steps:** Assign to Week 9 planning, create detailed component specs, start UI mockups.

