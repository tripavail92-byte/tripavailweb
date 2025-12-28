# Hotel Manager Flows - Complete Integration Plan

**Last Updated:** 26 Dec 2025  
**Status:** Week 3 Day 12 Complete, Days 13-15 Planned

---

## Overview

This document integrates three comprehensive hotel manager flows into the TripAvail development roadmap:

1. **Provider Onboarding (5 steps)** - Week 3 Days 11-14 ✅ Backend Complete
2. **Hotel Listing (7 steps)** - Week 4-5 Frontend Focus
3. **Package Creation (10 steps)** - Week 5-6 Full Implementation

---

## Flow 1: Provider Verification (5 Steps) - CURRENT

**Source:** Provider Onboarding Module (Day 12)  
**Status:** ✅ Backend Complete, Testing Done  
**Duration:** ~10-15 minutes per provider

### Steps:

1. **Business Information** - Company name, registration, contact details
2. **Owner Details** - Personal information, role verification
3. **Banking Information** - Payment account setup for payouts
4. **KYC Documents** - Business license, ID verification (Day 13)
5. **Review & Submit** - Final check, submit for admin approval

### API Endpoints (Implemented):

```
POST   /v1/provider-onboarding/start           ✅ DONE
PATCH  /v1/provider-onboarding/:id/step        ✅ DONE
POST   /v1/provider-onboarding/:id/submit      ✅ DONE
GET    /v1/provider-onboarding/:id/status      ✅ DONE
GET    /v1/provider-onboarding/list            ✅ DONE
```

### Database Schema:

```prisma
model ProviderProfile {
  id                  String              @id @default(cuid())
  userId              String
  providerType        ProviderType        // HOTEL_MANAGER | TOUR_OPERATOR
  businessName        String?
  businessDescription String?
  verificationStatus  VerificationStatus  @default(NOT_STARTED)
  verifiedAt          DateTime?
  bankName            String?
  bankAccount         String?
  onboarding          ProviderOnboarding?
}

model ProviderOnboarding {
  id             String              @id @default(cuid())
  providerId     String              @unique
  provider       ProviderProfile     @relation(fields: [providerId], references: [id])
  currentStep    Int                 @default(1)
  completedSteps Json?               // [1, 2, 3, 4, 5]
  submittedAt    DateTime?
  approvedAt     DateTime?
}
```

### Validation Logic:

- ✅ Step sequence validation (cannot skip steps)
- ✅ Progress calculation: (completedSteps.length / 5) \* 100
- ✅ Submit gate: All 5 steps required before submission
- ✅ Status transitions: NOT_STARTED → IN_PROGRESS → SUBMITTED → APPROVED

### Test Results:

```bash
✅ POST /start - Creates provider profile + onboarding tracker
✅ PATCH /:id/step - Updates step with validation
✅ POST /:id/submit - Changes status to SUBMITTED
✅ GET /:id/status - Returns progress: 100%, canSubmit: true
✅ Step skipping rejected with 400 error
✅ Incomplete submission rejected with step count validation
```

---

## Flow 2: Hotel Listing (7 Steps) - NEXT

**Source:** `hotel_manager_list_hotel_flow (1).md`  
**Target:** Week 4-5  
**Duration:** ~15-20 minutes per hotel

### Steps:

1. **Welcome & Overview** - Introduction, benefits, time estimate
2. **Basic Hotel Information** - Name, property type, star rating, description
3. **Location & Address** - Full address, map pin, coordinates
4. **Room Configuration** - Room types, quantities, base pricing
5. **Amenities & Services** - Category-based selection (WiFi, Pool, Spa, etc.)
6. **Policies & Rules** - Check-in/out times, cancellation policy, house rules
7. **Review & Submit** - Final review, edit sections, submit for publishing

### Required API Endpoints (Week 4):

```typescript
// Hotel Listing Management
POST   /v1/listings/start                    // Create new listing
PATCH  /v1/listings/:id/step                 // Update listing step
GET    /v1/listings/:id                      // Get listing details
POST   /v1/listings/:id/publish              // Publish listing

// Room Management
POST   /v1/listings/:id/rooms                // Add room types
PATCH  /v1/listings/:id/rooms/:roomId        // Update room
DELETE /v1/listings/:id/rooms/:roomId        // Remove room

// Amenities Management
POST   /v1/listings/:id/amenities            // Add amenities
GET    /v1/amenities/categories              // Get amenity categories
```

### Database Schema Updates Needed:

**1. Add Amenities Table:**

```sql
CREATE TABLE listing_amenities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  amenity TEXT NOT NULL,
  category TEXT NOT NULL, -- 'basic', 'technology', 'recreation', 'services'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listing_amenities_listing ON listing_amenities(listing_id);
```

**2. Add Policy Fields to Listings:**

```sql
ALTER TABLE listings
ADD COLUMN cancellation_policy TEXT,
ADD COLUMN house_rules TEXT,
ADD COLUMN pet_policy TEXT,
ADD COLUMN smoking_policy TEXT;
```

**3. Update Room Model:**

```prisma
model Room {
  id          String   @id @default(cuid())
  listingId   String
  listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
  name        String          // e.g., "Deluxe King Suite"
  roomType    String          // "single" | "double" | "twin" | "suite" | "family"
  capacity    Int             // max guests
  bedConfig   String          // e.g., "1 King Bed" or "2 Twin Beds"
  basePrice   Decimal  @db.Decimal(10, 2)
  quantity    Int             // number of this room type available
  amenities   Json?           // room-specific amenities
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Frontend Components (Week 4):

```typescript
// Step Components
<WelcomeStep />              // Welcome screen with benefits
<HotelInfoStep />            // Basic information form
<LocationStep />             // Map picker + address autocomplete
<RoomDetailsStep />          // Room type builder
<AmenitiesStep />            // Category-based amenity selector
<RulesStep />                // Policy templates + custom rules
<ReviewStep />               // Editable review with section navigation

// Shared Components
<StepProgress currentStep={n} totalSteps={7} />
<RoomTypeCard roomType={type} onEdit={handleEdit} />
<AmenityCategory category="basic" amenities={[...]} />
<PolicyTemplate type="flexible" impact="+15% bookings" />
<LocationPicker onLocationSelect={handleLocation} />
<PricingCalculator rooms={roomData} />
```

### Amenity Categories:

```typescript
const AMENITY_CATEGORIES = {
  basic: ['Free WiFi', 'Air Conditioning', 'Heating', 'Linens', 'Towels'],
  bathroom: ['Private Bathroom', 'Hair Dryer', 'Toiletries', 'Bathtub', 'Shower'],
  technology: ['TV', 'Phone', 'Safe', 'Mini Fridge', 'Coffee Maker'],
  services: ['Room Service', 'Laundry', 'Concierge', '24/7 Front Desk'],
  recreation: ['Pool', 'Gym', 'Spa', 'Restaurant', 'Bar'],
  accessibility: ['Wheelchair Accessible', 'Elevator', 'Braille Signs'],
  parking: ['Free Parking', 'Valet Parking', 'EV Charging', 'Airport Shuttle'],
};
```

### Validation Rules:

```typescript
const hotelListingValidation = {
  step2_basicInfo: {
    name: { required: true, maxLength: 80 },
    propertyType: { required: true, enum: PROPERTY_TYPES },
    starRating: { required: true, min: 1, max: 5 },
    description: { required: true, maxLength: 500 },
  },
  step3_location: {
    address: { required: true },
    city: { required: true },
    country: { required: true },
    coordinates: { required: true },
  },
  step4_rooms: {
    minRooms: 1,
    roomTypes: { required: true, minItems: 1 },
    pricing: { min: 0 },
  },
  step5_amenities: {
    minAmenities: 5, // Recommended minimum
  },
  step6_policies: {
    checkInTime: { required: true, format: 'HH:mm' },
    checkOutTime: { required: true, format: 'HH:mm' },
    cancellationPolicy: { required: true },
  },
};
```

### Gating Logic:

```typescript
// Before allowing hotel listing creation
const canCreateListing = async (userId: string) => {
  const provider = await prisma.providerProfile.findFirst({
    where: {
      userId,
      providerType: 'HOTEL_MANAGER',
    },
  });

  if (!provider) {
    throw new NotFoundException('Provider profile not found');
  }

  if (provider.verificationStatus !== 'APPROVED') {
    throw new ForbiddenException(
      'Your provider account must be approved before listing properties. ' +
        'Current status: ' +
        provider.verificationStatus,
    );
  }

  return true;
};
```

---

## Flow 3: Package Creation (10 Steps) - FUTURE

**Source:** `hotel_manager_package_creation_10_steps.md`  
**Target:** Week 5-6  
**Duration:** ~20-30 minutes per package

### Steps:

1. **Choose Package Type** - 8 types (Weekend, Romantic, Family, Business, Adventure, Culinary, Wellness, Luxury)
2. **Package Basics** - Name, description, duration, tags, target audience
3. **Media Upload** - Photos, videos, virtual tours
4. **Highlights** - Key selling points with icons
5. **Inclusions** - What's included in the package
6. **Exclusions** - What's NOT included
7. **Pricing** - Base price, seasonal pricing, discounts
8. **Calendar & Availability** - Date ranges, blackout dates
9. **Policy** - Cancellation, booking terms, group discounts
10. **Review & Publish** - Final check, competitive analysis, publish

### Package Types (8 Templates):

```typescript
const PACKAGE_TYPES = [
  {
    id: 'weekend-getaway',
    name: 'Weekend Getaway',
    description: 'Perfect for 2-3 day short trips',
    color: '#10B981',
    icon: 'calendar-weekend',
    suggestedDuration: '2-3 days',
    targetAudience: 'Couples, Friends',
    pricingRange: '$150-400',
  },
  {
    id: 'romantic-escape',
    name: 'Romantic Escape',
    description: 'Intimate packages for couples',
    color: '#EC4899',
    icon: 'heart',
    features: ['Couples amenities', 'Private dining', 'Spa treatments'],
    suggestedDuration: '2-4 days',
    pricingRange: '$300-800',
  },
  {
    id: 'family-adventure',
    name: 'Family Adventure',
    description: 'Fun-filled packages for families',
    color: '#3B82F6',
    icon: 'users-family',
    features: ['Kid-friendly activities', 'Family rooms', 'Entertainment'],
    suggestedDuration: '3-7 days',
    pricingRange: '$200-600',
  },
  {
    id: 'business-elite',
    name: 'Business Elite',
    description: 'Corporate rates and amenities',
    color: '#6B7280',
    icon: 'briefcase',
    features: ['Meeting rooms', 'Business center', 'Express services'],
    suggestedDuration: '1-5 days',
    pricingRange: '$250-500',
  },
  {
    id: 'adventure-package',
    name: 'Adventure Package',
    description: 'Outdoor experiences and thrills',
    color: '#F97316',
    icon: 'mountain',
    features: ['Outdoor activities', 'Equipment rental', 'Guided tours'],
    suggestedDuration: '3-10 days',
    pricingRange: '$400-1200',
  },
  {
    id: 'culinary-journey',
    name: 'Culinary Journey',
    description: 'Gourmet dining experiences',
    color: '#F59E0B',
    icon: 'utensils',
    features: ['Chef specials', 'Wine pairings', 'Cooking classes'],
    suggestedDuration: '2-5 days',
    pricingRange: '$350-900',
  },
  {
    id: 'wellness-retreat',
    name: 'Wellness Retreat',
    description: 'Spa and wellness focused',
    color: '#8B5CF6',
    icon: 'spa',
    features: ['Spa treatments', 'Yoga classes', 'Healthy dining'],
    suggestedDuration: '3-7 days',
    pricingRange: '$400-1000',
  },
  {
    id: 'luxury-experience',
    name: 'Luxury Experience',
    description: 'Ultra-premium VIP service',
    color: '#EAB308',
    icon: 'crown',
    features: ['Concierge service', 'Premium amenities', 'VIP treatment'],
    suggestedDuration: '2-14 days',
    pricingRange: '$800-3000',
  },
];
```

### Required API Endpoints (Week 5):

```typescript
// Package Management
POST   /v1/hotel-packages/start              // Create new package
PATCH  /v1/hotel-packages/:id/step           // Update package step
GET    /v1/hotel-packages/:id                // Get package details
POST   /v1/hotel-packages/:id/publish        // Publish package

// Media Management
POST   /v1/hotel-packages/:id/media          // Upload media
DELETE /v1/hotel-packages/:id/media/:mediaId // Remove media
POST   /v1/media/signed-url                  // Generate upload URL

// Package Templates
GET    /v1/hotel-packages/templates          // Get package templates
GET    /v1/hotel-packages/templates/:type    // Get specific template
```

### Database Schema:

```prisma
model HotelPackage {
  id            String        @id @default(cuid())
  providerId    String
  listingId     String        // References hotel listing
  packageType   String        // 'weekend-getaway', 'romantic-escape', etc.
  name          String
  description   String        @db.Text
  duration      Int           // days
  status        PackageStatus @default(DRAFT)
  basePrice     Decimal       @db.Decimal(10, 2)
  highlights    Json?         // Array of highlight objects
  inclusions    Json?         // Array of included items
  exclusions    Json?         // Array of excluded items
  media         Json?         // Array of media URLs
  availability  Json?         // Date ranges and blackout dates
  policies      Json?         // Cancellation, booking terms
  publishedAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([providerId])
  @@index([listingId])
  @@index([status])
  @@index([packageType])
}
```

### Gating Logic:

```typescript
// Before allowing package creation
const canCreatePackage = async (userId: string) => {
  // 1. Check provider is approved
  const provider = await prisma.providerProfile.findFirst({
    where: {
      userId,
      providerType: 'HOTEL_MANAGER',
    },
  });

  if (provider?.verificationStatus !== 'APPROVED') {
    throw new ForbiddenException('Provider must be approved');
  }

  // 2. Check has at least one published listing
  const listings = await prisma.listing.findMany({
    where: {
      providerId: provider.id,
      status: 'PUBLISHED',
    },
  });

  if (listings.length === 0) {
    throw new ForbiddenException(
      'You must have at least one published hotel listing ' + 'before creating packages',
    );
  }

  return true;
};
```

---

## Complete User Journey

### Timeline View:

```
Week 3 (Current): Provider Verification
├─ Day 11: RBAC Guards ✅
├─ Day 12: Provider Onboarding Backend ✅
├─ Day 13: KYC Documents 🔜
├─ Day 14: Admin Verification 🔜
└─ Day 15: Scaffolding for Listings/Packages 🔜

Week 4: Hotel Listing Implementation
├─ Day 16-17: Listing API + UI (Steps 1-4)
├─ Day 18-19: Amenities + Policies (Steps 5-6)
└─ Day 20: Review + Testing (Step 7)

Week 5: Package Creation Implementation
├─ Day 21-22: Package API + Type Selection (Steps 1-3)
├─ Day 23-24: Content + Pricing (Steps 4-7)
└─ Day 25: Calendar + Publishing (Steps 8-10)

Week 6: Integration + Testing
├─ Day 26-27: End-to-end testing
├─ Day 28-29: Admin panel enhancements
└─ Day 30: Launch preparation
```

### User Flow Sequence:

```
1. SIGN UP
   ↓
2. VERIFY OTP ✅
   ↓
3. PROVIDER ONBOARDING (5 steps) ✅ Backend Done
   - Business info
   - Owner details
   - Banking
   - KYC docs 🔜 Day 13
   - Submit for review
   ↓
4. ADMIN VERIFICATION 🔜 Day 14
   - Admin reviews documents
   - Approve/Reject
   ↓
5. [APPROVED] → HOTEL LISTING (7 steps) 🔜 Week 4
   - Basic info
   - Location
   - Rooms
   - Amenities
   - Policies
   - Review
   - Publish listing
   ↓
6. [LISTING PUBLISHED] → PACKAGE CREATION (10 steps) 🔜 Week 5
   - Package type
   - Basics
   - Media
   - Highlights/Inclusions/Exclusions
   - Pricing
   - Calendar
   - Policies
   - Publish package
   ↓
7. [PACKAGE LIVE] → Start Receiving Bookings 🎯
```

---

## Technical Reuse Patterns

### Shared Service Patterns:

Both flows reuse the step tracking pattern from provider onboarding:

```typescript
// Reusable step tracker service
abstract class StepTrackerService {
  abstract getTotalSteps(): number;

  async updateStep(recordId: string, step: number, stepData: any) {
    const record = await this.findRecord(recordId);

    // Validate step sequence
    if (step > record.currentStep + 1) {
      throw new BadRequestException('Cannot skip steps');
    }

    // Update completed steps
    const completedSteps = Array.isArray(record.completedSteps)
      ? [...(record.completedSteps as number[])]
      : [];
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    // Update record
    return this.prisma.update({
      where: { id: recordId },
      data: {
        currentStep: Math.max(record.currentStep, step),
        completedSteps,
      },
    });
  }

  calculateProgress(completedSteps: number[]): number {
    return Math.round((completedSteps.length / this.getTotalSteps()) * 100);
  }
}

// Implementations
class ProviderOnboardingService extends StepTrackerService {
  getTotalSteps() {
    return 5;
  } // HOTEL_MANAGER
}

class HotelListingService extends StepTrackerService {
  getTotalSteps() {
    return 7;
  }
}

class PackageCreationService extends StepTrackerService {
  getTotalSteps() {
    return 10;
  }
}
```

### Shared UI Components:

```typescript
// Reusable across all flows
<StepProgress currentStep={n} totalSteps={total} />
<StepNavigation onNext={handleNext} onBack={handleBack} />
<AutoSaveIndicator lastSaved={timestamp} />
<ValidationErrors errors={stepErrors} />
<ProgressBar percentage={progress} />
<SuccessModal onClose={handleClose} />
```

---

## Migration Scripts

### Week 3 → Week 4 Transition:

```sql
-- Add amenities support
CREATE TABLE listing_amenities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  amenity TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add policy fields
ALTER TABLE listings
ADD COLUMN cancellation_policy TEXT,
ADD COLUMN house_rules TEXT,
ADD COLUMN pet_policy TEXT,
ADD COLUMN smoking_policy TEXT;

-- Update Room model
ALTER TABLE rooms
ADD COLUMN room_type TEXT,
ADD COLUMN quantity INT DEFAULT 1,
ADD COLUMN amenities JSONB;
```

### Week 4 → Week 5 Transition:

```sql
-- Add package support
ALTER TABLE hotel_packages
ADD COLUMN package_type TEXT,
ADD COLUMN highlights JSONB,
ADD COLUMN inclusions JSONB,
ADD COLUMN exclusions JSONB,
ADD COLUMN media JSONB,
ADD COLUMN availability JSONB,
ADD COLUMN policies JSONB;

-- Add indexes
CREATE INDEX idx_hotel_packages_type ON hotel_packages(package_type);
CREATE INDEX idx_hotel_packages_listing ON hotel_packages(listing_id);
```

---

## Success Metrics

### Week 3 Targets:

- ✅ Provider onboarding: 100% backend complete
- 🔜 KYC upload: Functional with signed URLs
- 🔜 Admin verification: Review + approve workflow
- 🔜 Verification gate: Blocks unapproved providers

### Week 4 Targets:

- Hotel listing: 7-step flow implemented
- Room configuration: Multi-room type support
- Amenities: 40+ amenities across 7 categories
- Published listings: Appear in traveler search

### Week 5 Targets:

- Package creation: 10-step flow implemented
- Package types: 8 templates available
- Media upload: S3/MinIO integration
- Published packages: Bookable by travelers

---

## Risk Mitigation

### Technical Risks:

1. **Media Upload Complexity**
   - _Risk:_ Large files, slow uploads, storage costs
   - _Mitigation:_ Signed URLs, chunked uploads, image optimization

2. **Map Integration**
   - _Risk:_ Google Maps API costs, rate limits
   - _Mitigation:_ Cache geocoded results, batch requests, alternative providers

3. **Step Validation Complexity**
   - _Risk:_ Users get stuck, skip validation, lose data
   - _Mitigation:_ Auto-save every 30s, clear error messages, skip-with-warning option

### UX Risks:

1. **Flow Fatigue**
   - _Risk:_ Users abandon long flows (7-10 steps)
   - _Mitigation:_ Progress indicators, motivational copy, time estimates, save-and-resume

2. **Mobile Experience**
   - _Risk:_ Complex forms on small screens
   - _Mitigation:_ Mobile-first design, swipe navigation, simplified inputs

3. **Validation Friction**
   - _Risk:_ Too many validation errors block progress
   - _Mitigation:_ Real-time validation, helpful suggestions, smart defaults

---

## Next Actions

### Immediate (Day 13-14):

1. ✅ Complete KYC module (Day 13)
2. ✅ Implement admin verification (Day 14)
3. ✅ Build audit logging (Day 14)
4. ✅ Test verification workflow end-to-end

### Week 4 Preparation:

1. Create `listings` module scaffolding
2. Design amenity categorization
3. Build room type templates
4. Implement Google Maps integration
5. Create policy template system

### Week 5 Preparation:

1. Create `hotel-packages` module scaffolding
2. Design 8 package type templates
3. Build media upload service
4. Create pricing calculator
5. Implement availability calendar

---

**Document Status:** ✅ Complete Integration Plan  
**Next Review:** After Day 15 completion  
**Owner:** Development Team Lead
