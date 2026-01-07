# Admin Access Setup Guide

## 📋 Database Setup

### Admin User Already Exists in Seed

The admin user is pre-configured in the Prisma seed file (`backend/prisma/seed.ts`):

```typescript
// Admin User Details
Email:    admin@tripavail.com
Phone:    +1234567892
Password: $2b$10$mockHashedPasswordAdmin (mock - OTP-based in production)
Role:     ADMIN
Status:   emailVerified & phoneVerified = true
```

### Running the Seed Script

To create the admin user in your database:

```bash
# With Docker running:
docker-compose exec postgres psql -U postgres -d tripavail_dev -c \
  "INSERT INTO \"User\" (id, email, phone, role, \"emailVerified\", \"phoneVerified\", \"createdAt\", \"updatedAt\") \
   VALUES ('admin-001', 'admin@tripavail.com', '+1234567892', 'ADMIN', true, true, NOW(), NOW()) \
   ON CONFLICT (email) DO UPDATE SET role = 'ADMIN';"
```

Or run the full seed:

```bash
cd backend
pnpm prisma db seed
```

---

## 🔐 Authentication Flow for Admin

### Step 1: Start OTP Login

1. Go to frontend login page
2. Enter: `admin@tripavail.com` (email) or `+1234567892` (phone)
3. Click "Send OTP"

### Step 2: Verify OTP

1. The backend returns the OTP code in response (for development)
2. Copy the 6-digit code
3. Paste into OTP verification screen
4. Click "Verify"

### Step 3: Access Admin Dashboard

1. After successful login, user is redirected to `/traveler/dashboard`
2. Click "💼 Become a Partner" → No role shown (admin users skip this)
3. **OR** directly navigate to `/admin/dashboard`

### Step 4: Role Check

The frontend checks `user.role === 'ADMIN'`:

- ✅ If ADMIN → Shows AdminDashboard with purple sidebar
- ❌ If not ADMIN → Redirects to home page

---

## 🎯 Admin Dashboard Features

### Current Implementation (`/admin/dashboard`)

**Sidebar Menu:**

- 📊 Dashboard (Overview stats)
- ✅ Verification Queue (Pending provider approvals)
- ⚠️ Disputes (Active disputes & conflicts)
- 💳 Payments (Transaction logs)
- 💰 Payouts (Provider payouts)
- 📈 Analytics (Platform metrics)
- 👥 Users (User management)
- ⚙️ Settings (Platform settings)

**Dashboard Components:**

1. **Stats Grid** (4 cards):
   - Total Users: 342
   - Pending Approvals: 5
   - Active Disputes: 3
   - Monthly Revenue: PKR 2.3M

2. **Verification Queue** (left side - 5 pending providers):
   - Serena Hotels Pakistan (SUBMITTED)
   - Mountain Adventures Co. (UNDER_REVIEW)
   - Pearl Hotels Skardu (IN_PROGRESS)
   - Northern Trek Expeditions (SUBMITTED)
   - Hunza Valley Resorts (UNDER_REVIEW)

3. **Active Disputes** (right side - 3 disputes):
   - Room not as advertised (CRITICAL)
   - Guide did not show up (CRITICAL)
   - Refund request pending (MEDIUM)

---

## 🛠️ Database Schema

### User Model

```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  phone         String?  @unique
  role          UserRole @default(TRAVELER)  // TRAVELER | ADMIN
  emailVerified Boolean  @default(false)
  phoneVerified Boolean  @default(false)
  profiles      ProviderProfile[]  // Empty for admin users
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum UserRole {
  TRAVELER
  ADMIN
}
```

### ProviderProfile Model (for verification queue)

```prisma
model ProviderProfile {
  id                 String @id @default(cuid())
  userId            String
  providerType      ProviderType  // HOTEL_MANAGER | TOUR_OPERATOR
  businessName      String?
  verificationStatus VerificationStatus  // NOT_STARTED, IN_PROGRESS, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED
  submittedAt       DateTime?
  reviewedAt        DateTime?
  reviewedByAdminId String?
}
```

---

## 🚀 Testing Admin Access (Localhost)

### Prerequisites

- Backend running on `http://localhost:4100`
- Frontend running on `http://localhost:3000`
- PostgreSQL database seeded

### Test Steps

1. **Start OTP Login**

   ```bash
   POST /v1/auth/start
   {
     "email": "admin@tripavail.com",
     "channel": "email"
   }
   ```

   Response includes OTP code.

2. **Verify OTP**

   ```bash
   POST /v1/auth/verify
   {
     "email": "admin@tripavail.com",
     "code": "123456",
     "channel": "email"
   }
   ```

   Returns: `accessToken`, `refreshToken`, `user` with `role: "ADMIN"`

3. **Access Admin Dashboard**
   - Navigate to `http://localhost:3000/admin/dashboard`
   - Dashboard loads with purple sidebar
   - Verification queue, disputes, analytics visible

---

## 📱 Frontend Route Protection

### AdminDashboardPage (`/admin/dashboard/page.tsx`)

```typescript
useEffect(() => {
  if (!loading && (!user || user.role !== 'ADMIN')) {
    router.push('/'); // Redirect non-admins
  }
}, [user, loading, router]);
```

### Color Scheme

- **Primary:** Purple/Indigo (`from-purple-600 to-indigo-600`)
- **Accent:** Purple (`text-purple-600`)
- **Status badges:** Color-coded by approval status

---

## 🔄 Next Steps

### Pending Implementation:

1. **Verification Pages** (`/admin/verification`)
   - List all pending providers
   - Review KYC documents
   - Approve/Reject with reason

2. **Disputes Page** (`/admin/disputes`)
   - Detailed dispute view
   - Evidence review
   - Resolution tools

3. **Analytics Page** (`/admin/analytics`)
   - Charts & metrics
   - Revenue trends
   - User growth

4. **Payouts Page** (`/admin/payouts`)
   - Payout batch management
   - Settlement tracking
   - Provider statements

5. **Backend Integration**
   - Replace mock data with API calls
   - Real verification workflow
   - Dispute resolution logic

---

## ⚠️ Important Notes

1. **OTP Code in Response** (Development Only)
   - Currently, backend returns OTP code in HTTP response
   - **Production:** Should be sent via SMS/Email only

2. **Admin User Creation**
   - Pre-seeded in database
   - No special onboarding needed
   - Direct access to admin dashboard

3. **Role-Based Access Control**
   - Checked on frontend (user.role === 'ADMIN')
   - Should be validated on backend for API calls
   - RBAC guards exist in backend

4. **Mock Data**
   - Verification queue, disputes, payouts are mock data
   - Should be replaced with real API queries
   - Stats should be calculated from database

---

## 🔗 Related Files

- Frontend: [/admin/dashboard/page.tsx](web/src/app/admin/dashboard/page.tsx)
- Components: [AdminSidebar.tsx](web/src/components/AdminSidebar.tsx), [AdminDashboardLayout.tsx](web/src/components/AdminDashboardLayout.tsx)
- Backend Seed: [backend/prisma/seed.ts](backend/prisma/seed.ts)
- Schema: [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- Auth Service: [backend/src/auth/auth.service.ts](backend/src/auth/auth.service.ts)

---

**Created:** Jan 7, 2026  
**Status:** ✅ Phase 2 Admin Dashboard Complete
