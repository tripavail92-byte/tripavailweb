# Priority 2 Implementation - Quick Reference

## What Was Built

### Operator Profile Service
Location: `backend/src/operator_profile/`

**Methods:**
- `getOperatorProfile(providerId)` → OperatorProfile (creates if missing)
- `updateOperatorProfile(providerId, dto)` → OperatorProfile (updated)
- `getByProviderId(providerId)` → OperatorProfile | null

**Validation:**
- Checks provider exists and is TOUR_OPERATOR type
- Coordinates must be within valid ranges (-90 to 90 lat, -180 to 180 long)
- All fields optional (phased onboarding)

### Operator Profile API
Base: `/v1/operator-profile`

**GET /{providerId}**
```bash
curl http://localhost:4100/v1/operator-profile/provider_123 \
  -H "Authorization: Bearer {token}"
```
Returns: OperatorProfile object with all stored fields

**PATCH /{providerId}**
```bash
curl -X PATCH http://localhost:4100/v1/operator-profile/provider_123 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "baseCity": "Bangkok",
    "baseLatitude": 13.7563,
    "baseLongitude": 100.5018,
    "meetingPoint": "Grand Plaza Hotel",
    "contactPhone": "+66812345678"
  }
```
Returns: Updated OperatorProfile

**Guards**: JwtAuthGuard (auth required) + ProviderOwnerGuard (owns provider)

### Frontend Integration
Location: `/web/src/app/operator/profile/page.tsx`

**Features:**
- Form to update location and contact info
- Loads profile on mount
- Displays stored data for debugging
- Real-time state management

**Navigation**: Added "Profile" link to operator dashboard (`/operator/profile`)

### API Client Functions
Location: `web/src/lib/api-client.ts`

```typescript
// Get operator profile
const profile = await getOperatorProfile(providerId);

// Update operator profile
const updated = await updateOperatorProfile(providerId, {
  baseCity: 'Bangkok',
  baseLatitude: 13.7563,
  baseLongitude: 100.5018,
  meetingPoint: 'Grand Plaza Hotel',
  contactPhone: '+66812345678'
});
```

---

## How to Apply DB Migration

### Step 1: Ensure Database is Running
```bash
cd d:\tripavailweb
docker-compose up -d postgres
# Wait 10 seconds for startup
```

### Step 2: Apply Migration
```bash
cd backend
npx prisma migrate deploy
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Restart Backend
```bash
pnpm dev
```

---

## Testing (After Migration)

### Via Web UI
1. Go to `/operator` (need tour operator profile)
2. Click "Profile" in navigation
3. Fill form fields
4. Click "Save Profile"
5. Page refreshes and shows saved data

### Via API (cURL)
```bash
# Update profile
curl -X PATCH http://localhost:4100/v1/operator-profile/provider_123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"baseCity":"Bangkok","baseLatitude":13.7563}'

# Get profile
curl http://localhost:4100/v1/operator-profile/provider_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Via Postman
1. Set auth type to Bearer Token
2. Paste your JWT token
3. POST to `/v1/operator-profile/{providerId}` with JSON body
4. Should return 200 with OperatorProfile data

---

## Database Schema

```sql
-- Created by migration
CREATE TABLE "OperatorProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL UNIQUE,
  "baseCity" TEXT,
  "baseLatitude" REAL,
  "baseLongitude" REAL,
  "meetingPoint" TEXT,
  "contactPhone" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "OperatorProfile_providerId_fkey" 
    FOREIGN KEY ("providerId") REFERENCES "ProviderProfile" ("id") 
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OperatorProfile_providerId_key" ON "OperatorProfile"("providerId");
```

---

## File List

**Created:**
- `backend/src/operator_profile/operator-profile.service.ts`
- `backend/src/operator_profile/operator-profile.controller.ts`
- `backend/src/operator_profile/operator-profile.module.ts`
- `backend/src/operator_profile/dto/update-operator-profile.dto.ts`
- `backend/src/operator_profile/dto/index.ts`
- `web/src/app/operator/profile/page.tsx`

**Modified:**
- `backend/src/app.module.ts` (import + registration)
- `web/src/lib/api-client.ts` (2 functions + 1 interface)
- `web/src/app/operator/layout.tsx` (navigation link)

---

## Integration Points

### With Provider Onboarding
- OperatorProfile creation is lazy (on first API call)
- Doesn't block tour creation
- Works alongside existing onboarding flow

### With Tour Packages
- Profile data available for display in tour package context
- Meeting point can be used as default pickup
- Base location can be used for distance validation (future)

### With Tour Departures
- Base location useful for managing pickup points
- Contact phone can be displayed to customers (future)

---

## Next Steps (Priority 3)

**Google Maps Integration**
- Install @googlemaps/js-api-loader
- Create MapPicker component
- Connect to baseLatitude/baseLongitude fields
- Add to operator profile form

**Phase 2:**
- Google Places autocomplete for addresses
- Reverse geocoding for dropped pins
- Distance validation for pickup locations

---

## Troubleshooting

**"Provider not found" error:**
- Make sure you're using valid providerId
- Provider must exist in database
- Check provider type is 'TOUR_OPERATOR'

**"Cannot find property tourPackageAmenity":**
- Migration hasn't been applied yet
- Run: `npx prisma migrate deploy && npx prisma generate`
- Restart backend after migration

**Endpoint returns 401:**
- JWT token missing or expired
- Include: `Authorization: Bearer {token}` header

**CORS errors:**
- Ensure API is on port 4100
- Check CORS configuration in backend

---

**Ready to test? Apply the database migration first!**
