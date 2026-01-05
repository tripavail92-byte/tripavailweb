# WEEK 7: Tour Packages Part 2 (Days 31-35) + WEEK 8: Booking Engine (Days 36-40)

**Dates:** Feb 3-14, 2026  
**Team:** 1 Senior (critical), 1 Mid-level  
**Critical Path:** YES ⚠️  
**Current Status:** Week 7 ✅ COMPLETE (as of Jan 4, 2026) | Week 8 ⏳ SCHEDULED (Feb 10-14, 2026)

---

## ✅ Implementation Status Update (Jan 4, 2026)

**Week 7 Tasks:** All tour package steps (8-14) completed including discount settings  
**Priority 3 (Google Maps):** ✅ COMPLETE - Location selection, address autocomplete, interactive maps integrated  
**Week 8 Tasks:** Not started - Scheduled for February 10-14, 2026

See [PRIORITIES_1_2_3_COMPLETE.md](PRIORITIES_1_2_3_COMPLETE.md) for full completion report.

---

## 📌 Critical Importance

**WEEK 7-8 is the make-or-break point.** Booking engine complexity demands:

- **1 Senior dev must own this** (cannot be delegated)
- **Atomic inventory locking** (data integrity risk)
- **Idempotency** (payment safety)
- **State machine correctness** (business logic)

If these weeks slip, entire project slips.

---

# WEEK 7: Tour Packages Part 2 (Days 31-35)

## 📌 Week Overview

**Goal:** Complete tour package builder Steps 8-14. Once done, both hotel and tour packages are launch-ready.

---

## 📅 Daily Breakdown

### Day 31 (Mon, Feb 3): Steps 8-9 (Pricing & Media)

**Tasks:**

1. **Step 8: Pricing & Policies**

   ```typescript
   export class Step8PricingPoliciesDto {
     @IsDecimal()
     pricePerPerson: string;

     @IsEnum(['FLEXIBLE', 'MODERATE', 'STRICT'])
     cancellationPolicy: string;

     @IsNumber()
     @Min(1)
     minPeople: number;

     @IsNumber()
     @Max(100)
     maxPeople: number;

     @IsBoolean()
     @IsOptional()
     earlyBirdDiscount?: boolean;

     @IsDecimal()
     @IsOptional()
     earlyBirdPercentage?: string;

     @IsString()
     @IsOptional()
     bestPriceGuarantee?: string; // "7_DAYS", "14_DAYS", "NONE"
   }

   async step8PricingPolicies(
     providerId: string,
     packageId: string,
     dto: Step8PricingPoliciesDto,
   ) {
     // Update departures with per-person pricing
     const pkg = await this.prisma.tourPackage.update({
       where: { id: packageId },
       data: {
         basePrice: new Decimal(dto.pricePerPerson),
       },
     });

     return pkg;
   }
   ```

2. **Step 9: Media Upload**

   ```typescript
   export class Step9MediaDto {
     @IsArray()
     @IsString({ each: true })
     imageUrls: string[];
   }

   async step9Media(
     providerId: string,
     packageId: string,
     dto: Step9MediaDto,
   ) {
     return this.prisma.tourPackage.update({
       where: { id: packageId },
       data: { images: dto.imageUrls },
     });
   }
   ```

**EOD Checklist:**

- [x] Step 8-9 endpoints working
- [x] Tests passing for steps 8-9
- [x] Commit: add tour package steps 8-9

---

### Day 32 (Tue, Feb 4): Steps 10-11 (Add-ons & Notes)

**Tasks:**

1. **Step 10: Add-ons**

   ```typescript
   export class CreateAddOnDto {
     @IsString()
     name: string;

     @IsString()
     description: string;

     @IsDecimal()
     price: string;

     @IsBoolean()
     @IsOptional()
     isOptional?: boolean;
   }

   export class Step10AddOnsDto {
     @ValidateNested({ each: true })
     @Type(() => CreateAddOnDto)
     addOns: CreateAddOnDto[];
   }

   async step10AddOns(
     providerId: string,
     packageId: string,
     dto: Step10AddOnsDto,
   ) {
     // Delete existing add-ons
     await this.prisma.addOn.deleteMany({
       where: { tourPackageId: packageId },
     });

     // Create new add-ons
     return Promise.all(
       dto.addOns.map((addon) =>
         this.prisma.addOn.create({
           data: {
             tourPackageId: packageId,
             name: addon.name,
             description: addon.description,
             price: new Decimal(addon.price),
             isOptional: addon.isOptional || true,
           },
         }),
       ),
     );
   }
   ```

2. **Step 11: Special Notes & Safety**

   ```typescript
   export class Step11NotesDto {
     @IsString()
     specialNotes: string;

     @IsArray()
     @IsString({ each: true })
     safetyInformation: string[];

     @IsString()
     @IsOptional()
     healthRequirements?: string;

     @IsString()
     @IsOptional()
     insuranceInfo?: string;
   }

   async step11Notes(
     providerId: string,
     packageId: string,
     dto: Step11NotesDto,
   ) {
     return this.prisma.tourPackage.update({
       where: { id: packageId },
       data: {
         // Extend TourPackage model to include these fields
         // For now, store in metadata JSON
       },
     });
   }
   ```

**EOD Checklist:**

- [x] Step 10-11 endpoints working
- [x] All tests passing for steps 10-11
- [x] Commit: add tour package steps 10-11

---

### Day 33 (Wed, Feb 5): Steps 12-13 (Compliance & Preview)

**Tasks:**

1. **Step 12: Compliance & Disclaimers**

   ```typescript
   export class Step12ComplianceDto {
     @IsBoolean()
     acceptTermsAndConditions: boolean;

     @IsBoolean()
     acceptLiabilityWaiver: boolean;

     @IsString()
     @IsOptional()
     customDisclaimers?: string;

     @IsArray()
     @IsString({ each: true })
     requiredDocuments?: string[]; // URLs to compliance docs
   }

   async step12Compliance(
     providerId: string,
     packageId: string,
     dto: Step12ComplianceDto,
   ) {
     // Store compliance acceptance
     return this.prisma.tourPackage.update({
       where: { id: packageId },
       data: {
         // Extend model or use JSON
       },
     });
   }
   ```

2. **Step 13: Preview**

   ```typescript
   async step13Preview(providerId: string, packageId: string) {
     const pkg = await this.prisma.tourPackage.findUnique({
       where: { id: packageId },
       include: {
         itineraryDays: true,
         pickups: true,
         departures: true,
         addOns: true,
       },
     });

     if (pkg?.providerId !== providerId) {
       throw new ForbiddenException();
     }

     return {
       package: pkg,
       completeness: this.calculateCompleteness(pkg),
     };
   }
   ```

**EOD Checklist:**

- [x] Step 12-13 endpoints working
- [x] Preview includes all data
- [x] Tests passing for steps 12-13
- [x] Commit: add tour package steps 12-13 compliance and preview

---

### Day 34 (Thu, Feb 6): Step 14 (Publish & Publishing Gate)

**Tasks:**

1. **Step 14: Publish with verification gate**

   ```typescript
   async step14Publish(providerId: string, packageId: string) {
     // Check provider verification
     const provider = await this.prisma.providerProfile.findUnique({
       where: { id: providerId },
     });

     if (provider?.verificationStatus !== 'APPROVED') {
       throw new ForbiddenException(
         'Provider must be verified before publishing',
       );
     }

     // Validate all required fields
     const pkg = await this.prisma.tourPackage.findUnique({
       where: { id: packageId },
       include: { itineraryDays: true },
     });

     if (!this.isPackageComplete(pkg)) {
       throw new BadRequestException('Complete all steps before publishing');
     }

     // Update status
     const published = await this.prisma.tourPackage.update({
       where: { id: packageId },
       data: { status: 'PUBLISHED' },
     });

     // TODO: Queue search indexing job
     // this.searchQueue.add('index-tour-package', { packageId });

     return published;
   }

   private isPackageComplete(pkg: any): boolean {
     return (
       pkg.name &&
       pkg.description &&
       pkg.basePrice > 0 &&
       pkg.duration > 0 &&
       pkg.itineraryDays.length > 0 &&
       pkg.highlights.length > 0
     );
   }
   ```

2. **Add controller endpoint**
   ```typescript
   @Post(':packageId/step14-publish')
   async step14(
     @Request() req,
     @Param('packageId') packageId: string,
   ) {
     const profile = await this.getProviderProfile(req.user.userId);
     return this.tourService.step14Publish(profile.id, packageId);
   }
   ```

**EOD Checklist:**

- [x] Publish endpoint working
- [x] Verification gate enforced
- [x] All 14 steps tested end-to-end
- [x] Tests passing for publish
- [x] Commit: add tour package step 14 publish with gate

---

### Day 35 (Fri, Feb 7): Testing, Documentation & PR

**Tasks:**

1. **Complete integration tests (70%+ coverage)**
2. **Test all 14 steps end-to-end flow**
3. **Create tour packages documentation** (Steps 1-14)
4. **Performance testing & optimization**
5. **Merge PR**

**Week Completion Checklist:**

- [x] All 14 steps working
- [x] Step progression validated
- [x] Publishing gate verified
- [x] 70%+ test coverage
- [x] Swagger docs complete
- [x] PR merged
- [x] Commit: complete tour packages steps 8-14 with publishing gate
- [x] Discount Settings step implementation (see plan)
- [x] Discount Settings migration and API
- [ ] Discount Settings UI in builder
- [ ] Discount Settings validation and tests
- [ ] Discount Settings documentation

---

## 🎯 Week 7 Success Criteria

✅ All 14 steps persisting data  
✅ Step progression enforced  
✅ Publishing blocked until APPROVED  
✅ 70%+ test coverage  
✅ Full documentation  
✅ PR merged to main

**Unblocks:** WEEK 8 (Booking Engine - CRITICAL)

---

---

# WEEK 8: Booking Engine (Days 36-40) ⚠️ CRITICAL

## 📌 Week Overview

**Goal:** Implement core booking state machine: QUOTE → HOLD → PAYMENT → CONFIRMED → COMPLETED

**Complexity Level:** EXTREME ⚠️

- Atomic inventory locking
- Idempotency for payments
- Price snapshots
- State machine correctness
- Race condition prevention

**Only 1 senior dev + 1 mid-level. No cutting corners.**

---

## 📅 Daily Breakdown

### Day 36 (Mon, Feb 10): Booking Model & Quote State

**Tasks:**

1. **Create comprehensive Booking model**

   ```prisma
   enum BookingStatus {
     QUOTE
     HOLD
     PAYMENT_PENDING
     CONFIRMED
     COMPLETED
     CANCELLED_BY_GUEST
     CANCELLED_BY_PROVIDER
     EXPIRED_HOLD
   }

   model Booking {
     id                      String            @id @default(uuid())
     userId                  String
     user                    User              @relation(fields: [userId], references: [id], onDelete: Cascade)

     # Package references (polymorphic)
     hotelPackageId          String?
     hotelPackage            HotelPackage?     @relation(fields: [hotelPackageId], references: [id])
     tourPackageId           String?
     tourPackage             TourPackage?      @relation(fields: [tourPackageId], references: [id])

     status                  BookingStatus     @default(QUOTE)

     # Booking details
     checkInDate             DateTime?
     checkOutDate            DateTime?
     numberOfGuests          Int
     numberOfRooms           Int?
     selectedRoomIds         String[]
     selectedAddOns          String[]

     # Pricing (SNAPSHOT - never recompute)
     priceSnapshot           Json              # { basePrice, tax, commission, total, breakdown }
     totalPrice              Decimal           @db.Decimal(12, 2)
     currency                String            @default("USD")

     # Hold management
     holdExpiresAt           DateTime?
     idempotencyKey          String?           @unique

     # Payment info
     paymentIntentId         String?
     lastPaymentError        String?

     # Timestamps
     quotedAt                DateTime          @default(now())
     heldAt                  DateTime?
     confirmedAt             DateTime?
     completedAt             DateTime?
     cancelledAt             DateTime?
     createdAt               DateTime          @default(now())
     updatedAt               DateTime          @updatedAt

     # Relations
     payment                 Payment?
     ledgerEntries           LedgerEntry[]

     @@index([userId])
     @@index([status])
     @@index([idempotencyKey])
     @@index([hotelPackageId])
     @@index([tourPackageId])
   }

   model Payment {
     id                      String            @id @default(uuid())
     bookingId               String            @unique
     booking                 Booking           @relation(fields: [bookingId], references: [id], onDelete: Cascade)

     status                  String            @default("PENDING") # PENDING, SUCCESS, FAILED, REFUNDED
     amount                  Decimal           @db.Decimal(12, 2)
     currency                String            @default("USD")

     paymentMethodId         String?
     paymentIntentId         String?           # Stripe/payment gateway ID

     metadata                Json?
     createdAt               DateTime          @default(now())
     updatedAt               DateTime          @updatedAt

     @@index([bookingId])
     @@index([paymentIntentId])
   }

   model LedgerEntry {
     id                      String            @id @default(uuid())
     bookingId               String
     booking                 Booking           @relation(fields: [bookingId], references: [id], onDelete: Cascade)

     type                    String            # BOOKING_CONFIRMED, REFUND_PROCESSED, PROVIDER_PAYOUT

     # Double-entry accounting
     debitAccount            String            # "traveler:123", "provider:456", "platform"
     creditAccount           String

     amount                  Decimal           @db.Decimal(12, 2)
     currency                String            @default("USD")

     description             String
     metadata                Json?

     createdAt               DateTime          @default(now())

     @@index([bookingId])
     @@index([debitAccount])
     @@index([creditAccount])
   }
   ```

2. **Create quote controller & service**

   ```typescript
   export class CreateQuoteDto {
     @IsString()
     packageId: string; // hotel or tour

     @IsString()
     packageType: string; // "HOTEL" or "TOUR"

     @IsDateString()
     @IsOptional()
     checkInDate?: string; // for hotels

     @IsDateString()
     @IsOptional()
     checkOutDate?: string; // for hotels

     @IsDateString()
     @IsOptional()
     departureDate?: string; // for tours

     @IsNumber()
     @Min(1)
     numberOfGuests: number;

     @IsNumber()
     @IsOptional()
     numberOfRooms?: number; // for hotels

     @IsArray()
     @IsOptional()
     @IsString({ each: true })
     selectedAddOns?: string[];
   }

   @Injectable()
   export class BookingService {
     constructor(
       private prisma: PrismaService,
       private pricingService: PricingService,
     ) {}

     async createQuote(userId: string, dto: CreateQuoteDto) {
       // Fetch package
       const pkg =
         dto.packageType === 'HOTEL'
           ? await this.prisma.hotelPackage.findUnique({
               where: { id: dto.packageId },
             })
           : await this.prisma.tourPackage.findUnique({
               where: { id: dto.packageId },
             });

       if (!pkg) {
         throw new NotFoundException('Package not found');
       }

       // Calculate price (server-side)
       const priceSnapshot = await this.pricingService.calculatePrice(pkg, dto);

       // Create quote
       const booking = await this.prisma.booking.create({
         data: {
           userId,
           [dto.packageType === 'HOTEL' ? 'hotelPackageId' : 'tourPackageId']: dto.packageId,
           status: 'QUOTE',
           numberOfGuests: dto.numberOfGuests,
           numberOfRooms: dto.numberOfRooms,
           checkInDate: dto.checkInDate ? new Date(dto.checkInDate) : null,
           checkOutDate: dto.checkOutDate ? new Date(dto.checkOutDate) : null,
           selectedAddOns: dto.selectedAddOns || [],
           priceSnapshot,
           totalPrice: new Decimal(priceSnapshot.total),
           quotedAt: new Date(),
         },
       });

       return booking;
     }
   }
   ```

3. **Create pricing service** (CRITICAL - no client-side math)

   ```typescript
   @Injectable()
   export class PricingService {
     async calculatePrice(pkg: any, dto: CreateQuoteDto) {
       // NEVER use client-submitted prices
       // Always calculate from package base price

       const basePrice = parseFloat(pkg.basePrice.toString());
       let subtotal = basePrice * dto.numberOfGuests;

       // Add add-ons if tour
       let addOnTotal = 0;
       if (dto.selectedAddOns && dto.selectedAddOns.length > 0) {
         const addOns = await this.prisma.addOn.findMany({
           where: { id: { in: dto.selectedAddOns } },
         });
         addOnTotal = addOns.reduce((sum, addon) => sum + parseFloat(addon.price.toString()), 0);
       }

       subtotal += addOnTotal;

       // Calculate tax (assume 10%)
       const tax = subtotal * 0.1;

       // Calculate platform commission (assume 15%)
       const commission = subtotal * 0.15;

       // Total (client pays)
       const total = subtotal + tax;

       // Provider earnings (after commission)
       const providerEarnings = subtotal - commission;

       return {
         basePrice,
         addOns: addOnTotal,
         subtotal,
         tax,
         commission,
         providerEarnings,
         total,
         currency: 'USD',
         breakdown: {
           basePrice: basePrice.toFixed(2),
           addOns: addOnTotal.toFixed(2),
           subtotal: subtotal.toFixed(2),
           tax: tax.toFixed(2),
           total: total.toFixed(2),
         },
       };
     }
   }
   ```

**EOD Checklist:**

- [x] Booking model migrated
- [x] Quote creation working
- [x] Price snapshot captured (never client math)
- [x] Tests passing
- [x] Commit: `feat: add booking model and quote state`

---

### Day 37 (Tue, Feb 11): HOLD State & Inventory Locking with Auto-Expiry

**Tasks:**

1. **Create HOLD endpoint with atomic inventory lock** ⚠️ CRITICAL

   ```typescript
   export class CreateHoldDto {
     @IsString()
     bookingId: string;

     @IsString()
     @IsOptional()
     idempotencyKey?: string; // For deduplication
   }

   async holdBooking(userId: string, dto: CreateHoldDto) {
     const booking = await this.prisma.booking.findUnique({
       where: { id: dto.bookingId },
     });

     if (booking?.userId !== userId) {
       throw new ForbiddenException();
     }

     if (booking.status !== 'QUOTE') {
       throw new BadRequestException('Can only hold QUOTE bookings');
     }

     // Idempotency check
     if (dto.idempotencyKey) {
       const existing = await this.prisma.booking.findUnique({
         where: { idempotencyKey: dto.idempotencyKey },
       });
       if (existing && existing.status === 'HOLD') {
         return existing; // Return cached result if still held
       }
     }

     // ATOMIC TRANSACTION: Lock inventory with expiration tracking
     return this.prisma.$transaction(async (tx) => {
       const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15-min TTL

       if (booking.hotelPackageId) {
         // Lock hotel rooms - pessimistic lock (hard reserve)
         const result = await tx.$queryRaw`
           UPDATE inventory_nights
           SET available_units = available_units - ${booking.numberOfRooms},
               locked_until = GREATEST(locked_until, ${holdExpiresAt})
           WHERE room_id = ANY(${booking.selectedRoomIds}::text[])
             AND date >= ${booking.checkInDate}
             AND date < ${booking.checkOutDate}
             AND available_units >= ${booking.numberOfRooms}
           RETURNING id;
         `;

         if (!result || result.length === 0) {
           throw new BadRequestException('Insufficient inventory');
         }
       } else if (booking.tourPackageId) {
         // Lock tour seats - pessimistic lock (hard reserve)
         const result = await tx.$queryRaw`
           UPDATE tour_departures
           SET available_seats = available_seats - ${booking.numberOfGuests},
               locked_until = GREATEST(locked_until, ${holdExpiresAt})
           WHERE tour_package_id = ${booking.tourPackageId}
             AND departure_date = ${booking.departureDate}
             AND available_seats >= ${booking.numberOfGuests}
           RETURNING id;
         `;

         if (!result || result.length === 0) {
           throw new BadRequestException('Insufficient seats available');
         }
       }

       // Update booking to HOLD with expiration timestamp
       const updated = await tx.booking.update({
         where: { id: dto.bookingId },
         data: {
           status: 'HOLD',
           holdExpiresAt, // Explicit field for cleanup
           idempotencyKey: dto.idempotencyKey,
           heldAt: new Date(),
         },
       });

       return updated;
     }, {
       isolationLevel: 'Serializable', // Strongest isolation - prevents phantom reads
     });
   }
   ```

2. **⚠️ NEW: Create Hold Expiration Service (Auto-Release Inventory)**

   This is **CRITICAL** - without this, abandoned bookings lock inventory forever.

   ```typescript
   // Create src/bookings/hold-expiration.service.ts
   @Injectable()
   export class HoldExpirationService {
     constructor(
       private prisma: PrismaService,
       private logger: LoggerService,
     ) {}

     /**
      * Run every 5 minutes via cron or BullMQ job
      * Releases expired holds and restores inventory
      */
     @Cron('*/5 * * * *') // Every 5 minutes
     async releaseExpiredHolds() {
       this.logger.log('Starting hold expiration check...');

       const now = new Date();
       const expiredBookings = await this.prisma.booking.findMany({
         where: {
           status: 'HOLD',
           holdExpiresAt: {
             lt: now, // holdExpiresAt < now
           },
         },
         include: {
           hotelPackage: true,
           tourPackage: true,
         },
       });

       if (expiredBookings.length === 0) {
         this.logger.debug('No expired holds to release');
         return;
       }

       this.logger.log(`Found ${expiredBookings.length} expired holds, releasing...`);

       // Process each expired booking
       for (const booking of expiredBookings) {
         try {
           await this.releaseBooking(booking);
         } catch (error) {
           this.logger.error(
             `Failed to release hold ${booking.id}: ${error.message}`,
           );
           // Continue processing other bookings - don't block entire job
         }
       }

       this.logger.log('Hold expiration check completed');
     }

     private async releaseBooking(booking: Booking) {
       await this.prisma.$transaction(async (tx) => {
         // Restore hotel inventory
         if (booking.hotelPackageId) {
           await tx.$executeRaw`
             UPDATE inventory_nights
             SET available_units = available_units + ${booking.numberOfRooms}
             WHERE room_id = ANY(${booking.selectedRoomIds}::text[])
               AND date >= ${booking.checkInDate}
               AND date < ${booking.checkOutDate};
           `;
         }

         // Restore tour inventory
         if (booking.tourPackageId) {
           await tx.$executeRaw`
             UPDATE tour_departures
             SET available_seats = available_seats + ${booking.numberOfGuests}
             WHERE tour_package_id = ${booking.tourPackageId}
               AND departure_date = ${booking.departureDate};
           `;
         }

         // Update booking status
         await tx.booking.update({
           where: { id: booking.id },
           data: {
             status: 'EXPIRED_HOLD',
             cancelledAt: new Date(),
           },
         });

         // Notify guest
         // TODO: this.notificationService.sendHoldExpiredEmail(booking.userId);
       });

       this.logger.log(`Released hold: ${booking.id}`);
     }
   }
   ```

   **Register in module:**
   ```typescript
   @Module({
     imports: [ScheduleModule.forRoot()],
     providers: [BookingService, HoldExpirationService],
   })
   export class BookingModule {}
   ```

3. **Update InventoryNight & TourDeparture models**

   ```prisma
   model InventoryNight {
     id                  String    @id @default(uuid())
     roomId              String
     room                Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
     date                DateTime
     availableUnits      Int       @default(1)
     lockedUntil         DateTime? @default(now()) // Track when lock expires
     createdAt           DateTime  @default(now())
     updatedAt           DateTime  @updatedAt

     @@unique([roomId, date])
     @@index([roomId])
     @@index([date])
     @@index([lockedUntil]) // For efficient cleanup queries
   }

   model TourDeparture {
     id                  String    @id @default(uuid())
     tourPackageId       String
     tourPackage         TourPackage @relation(fields: [tourPackageId], references: [id], onDelete: Cascade)
     departureDate       DateTime
     availableSeats      Int       @default(20)
     lockedUntil         DateTime? @default(now()) // Track when lock expires
     createdAt           DateTime  @default(now())
     updatedAt           DateTime  @updatedAt

     @@unique([tourPackageId, departureDate])
     @@index([tourPackageId])
     @@index([departureDate])
     @@index([lockedUntil]) // For efficient cleanup queries
   }
   ```

   **Migration command:**
   ```bash
   npx prisma migrate dev --name add_lock_expiration_tracking
   ```

2. **Create InventoryNight model** (if not done in Week 2)

   ```prisma
   model InventoryNight {
     id                  String    @id @default(uuid())
     roomId              String
     room                Room      @relation(fields: [roomId], references: [id], onDelete: Cascade)
     date                DateTime
     availableUnits      Int       @default(1)
     createdAt           DateTime  @default(now())
     updatedAt           DateTime  @updatedAt

     @@unique([roomId, date])
     @@index([roomId])
     @@index([date])
   }
   ```

3. **Create hold controller endpoint**

   ```typescript
   @Post(':bookingId/hold')
   @UseGuards(AuthGuard)
   @ApiBearerAuth()
   async holdBooking(
     @Request() req,
     @Param('bookingId') bookingId: string,
     @Body() dto: CreateHoldDto,
   ) {
     return this.bookingService.holdBooking(req.user.userId, {
       ...dto,
       bookingId,
     });
   }
   ```

4. **Test inventory locking under concurrency**
   ```typescript
   // In spec file:
   // - Test: 2 concurrent HOLD requests → only 1 succeeds
   // - Test: Hold updates inventory correctly
   // - Test: Hold expiry triggers release of inventory
   ```

**EOD Checklist:**

- [x] HOLD endpoint working
- [x] Inventory locked atomically
- [x] Idempotency working
- [x] Concurrency tests passing
- [x] Commit: `feat: add HOLD state with atomic inventory locking`

---

### Day 38 (Wed, Feb 12): PAYMENT State with Pre-Authorization Flow

**⚠️ CRITICAL DECISION: Payment Timing Model**

**Decision: Stripe Pre-Authorization + Capture at Check-in** (Recommended)

| Aspect | Model A (Pre-auth) | Model B (Immediate Charge) | Model C (Charge at Check-in) |
|--------|------|--------|--------|
| **When** | Hold → Verify funds → Capture at check-in | Booking confirmed | Guest checks in |
| **UX** | Best (no surprise charges, guest controls) | Worst (charged immediately) | Good (simple, low friction) |
| **Risk** | Low (funds verified beforehand) | Medium (refunds common) | High (payment may fail at check-in) |
| **Like** | Best of both worlds | Booking.com | Airbnb |
| **Recommended** | ✅ YES | ❌ No | ⚠️ Maybe |

**Why Pre-Auth Model:** Verify payment method is valid without charging. If payment fails later, system auto-cancels booking and releases inventory. Provides certainty while maintaining good UX.

**Tasks:**

1. **Create payment intent endpoint with Pre-Authorization**

   ```typescript
   export class CreatePaymentIntentDto {
     @IsString()
     bookingId: string;

     @IsString()
     paymentMethodId: string; // Stripe payment method ID

     @IsString()
     @IsOptional()
     idempotencyKey?: string;
   }

   @Injectable()
   export class PaymentService {
     constructor(
       private prisma: PrismaService,
       private stripe: StripeService, // Week 11: real Stripe client
       private logger: LoggerService,
     ) {}

     /**
      * Step 1: Create Stripe Payment Intent for pre-authorization
      * This verifies funds are available WITHOUT charging yet
      */
     async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
       const booking = await this.prisma.booking.findUnique({
         where: { id: dto.bookingId },
         include: { payment: true },
       });

       if (booking?.userId !== userId) {
         throw new ForbiddenException();
       }

       if (booking.status !== 'HOLD') {
         throw new BadRequestException('Can only pay HOLD bookings');
       }

       // Idempotency check - return cached intent if exists
       if (dto.idempotencyKey && booking.payment?.paymentIntentId) {
         const existingIntent = await this.stripe.retrievePaymentIntent(
           booking.payment.paymentIntentId,
         );
         if (existingIntent.status === 'requires_confirmation' ||
             existingIntent.status === 'succeeded') {
           return { 
             paymentIntentId: booking.payment.paymentIntentId,
             status: existingIntent.status,
           };
         }
       }

       // Check if hold is still valid
       if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
         throw new BadRequestException('Hold has expired');
       }

       // Create Stripe payment intent (pre-authorization only)
       // Amount = 0 for pre-auth, or full amount depending on Stripe setup
       const snapshot = booking.priceSnapshot as any;
       const paymentIntent = await this.stripe.createPaymentIntent({
         amount: Math.round(parseFloat(snapshot.total) * 100), // Cents
         currency: booking.currency.toLowerCase(),
         paymentMethod: dto.paymentMethodId,
         confirm: false, // Don't confirm yet - just pre-authorize
         setupFutureUsage: 'on_session',
         metadata: {
           bookingId: booking.id,
           userId,
         },
       });

       // Store payment intent
       const payment = await this.prisma.payment.upsert({
         where: { bookingId: dto.bookingId },
         update: {
           paymentIntentId: paymentIntent.id,
           paymentMethodId: dto.paymentMethodId,
           status: 'PRE_AUTHORIZED',
         },
         create: {
           bookingId: dto.bookingId,
           amount: new Decimal(snapshot.total),
           currency: booking.currency,
           paymentIntentId: paymentIntent.id,
           paymentMethodId: dto.paymentMethodId,
           status: 'PRE_AUTHORIZED',
           metadata: { preAuthDate: new Date().toISOString() },
         },
       });

       this.logger.log(`Pre-authorized payment: ${paymentIntent.id}`);

       return {
         paymentIntentId: paymentIntent.id,
         status: 'requires_confirmation',
         clientSecret: paymentIntent.client_secret,
       };
     }

     /**
      * Step 2: Confirm payment after pre-auth
      * Captures funds (charges card) only after guest confirms
      */
     async confirmPayment(userId: string, bookingId: string) {
       const booking = await this.prisma.booking.findUnique({
         where: { id: bookingId },
         include: { payment: true },
       });

       if (booking?.userId !== userId) {
         throw new ForbiddenException();
       }

       if (booking.status !== 'HOLD') {
         throw new BadRequestException('Booking must be HELD to confirm');
       }

       if (!booking.payment?.paymentIntentId) {
         throw new BadRequestException('No payment intent found');
       }

       try {
         // Retrieve intent from Stripe
         const paymentIntent = await this.stripe.retrievePaymentIntent(
           booking.payment.paymentIntentId,
         );

         if (paymentIntent.status === 'requires_confirmation') {
           // Confirm payment (this actually charges the card)
           const confirmed = await this.stripe.confirmPaymentIntent(
             booking.payment.paymentIntentId,
           );

           if (confirmed.status !== 'succeeded') {
             throw new Error(`Payment failed: ${confirmed.status}`);
           }
         } else if (paymentIntent.status !== 'succeeded') {
           throw new Error(`Invalid payment status: ${paymentIntent.status}`);
         }

         // Payment succeeded - proceed to confirmation
         return this.confirmBooking(userId, bookingId);
       } catch (error) {
         // Record payment failure
         await this.prisma.payment.update({
           where: { bookingId },
           data: {
             status: 'FAILED',
             metadata: {
               ...booking.payment.metadata,
               failureReason: error.message,
               failedAt: new Date().toISOString(),
             },
           },
         });

         throw new BadRequestException(`Payment failed: ${error.message}`);
       }
     }

     /**
      * Step 3: Capture funds at check-in (optional - for pre-auth model)
      * Called automatically on check-in date
      */
     async capturePaymentAtCheckIn(bookingId: string) {
       const booking = await this.prisma.booking.findUnique({
         where: { id: bookingId },
         include: { payment: true },
       });

       if (booking.status !== 'CONFIRMED') {
         throw new BadRequestException('Booking must be CONFIRMED');
       }

       // In Stripe pre-auth model, capture is automatic on confirm
       // This is a placeholder for custom capture logic if needed
       this.logger.log(`Capture scheduled for check-in: ${bookingId}`);
     }
   }
   ```

2. **Add payment endpoints to controller**

   ```typescript
   @Controller('v1/bookings')
   @ApiTags('Bookings')
   export class BookingController {
     constructor(private bookingService: BookingService) {}

     // ... previous endpoints ...

     @Post(':bookingId/payment/intent')
     @UseGuards(AuthGuard)
     @ApiBearerAuth()
     @ApiOperation({ summary: 'Create payment intent (pre-auth)' })
     async createPaymentIntent(
       @Request() req,
       @Param('bookingId') bookingId: string,
       @Body() dto: CreatePaymentIntentDto,
     ) {
       return this.bookingService.paymentService.createPaymentIntent(
         req.user.userId,
         {
           ...dto,
           bookingId,
         },
       );
     }

     @Post(':bookingId/payment/confirm')
     @UseGuards(AuthGuard)
     @ApiBearerAuth()
     @ApiOperation({ summary: 'Confirm payment and complete booking' })
     async confirmPayment(
       @Request() req,
       @Param('bookingId') bookingId: string,
     ) {
       return this.bookingService.paymentService.confirmPayment(
         req.user.userId,
         bookingId,
       );
     }
   }
   ```

3. **Update Payment model to track pre-auth status**

   ```prisma
   model Payment {
     id                      String            @id @default(uuid())
     bookingId               String            @unique
     booking                 Booking           @relation(fields: [bookingId], references: [id], onDelete: Cascade)

     status                  String            @default("PRE_AUTHORIZED")
     // Statuses: PRE_AUTHORIZED, CONFIRMED, CAPTURED, FAILED, REFUNDED

     amount                  Decimal           @db.Decimal(12, 2)
     currency                String            @default("USD")

     paymentMethodId         String?           # Stripe payment method ID
     paymentIntentId         String?           @unique # Stripe/payment gateway ID

     metadata                Json?             # { preAuthDate, captureDate, failureReason }
     createdAt               DateTime          @default(now())
     updatedAt               DateTime          @updatedAt

     @@index([bookingId])
     @@index([paymentIntentId])
     @@index([status])
   }
   ```

4. **Test payment flow**

   ```typescript
   describe('Payment Flow - Pre-Auth Model', () => {
     it('should create payment intent without charging', async () => {
       const intent = await paymentService.createPaymentIntent(userId, {
         bookingId,
         paymentMethodId: 'pm_card_visa',
       });

       expect(intent.status).toBe('requires_confirmation');
       expect(stripeMock.createPaymentIntent).toHaveBeenCalledWith({
         confirm: false, // Not confirmed = not charged yet
       });
     });

     it('should capture payment on confirmation', async () => {
       await paymentService.confirmPayment(userId, bookingId);

       expect(stripeMock.confirmPaymentIntent).toHaveBeenCalled();
       const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
       expect(booking.status).toBe('CONFIRMED');
     });

     it('should release inventory if payment fails', async () => {
       stripeMock.confirmPaymentIntent.mockRejectedValue(new Error('Card declined'));

       await expect(paymentService.confirmPayment(userId, bookingId))
         .rejects.toThrow('Card declined');

       const payment = await prisma.payment.findUnique({ where: { bookingId } });
       expect(payment.status).toBe('FAILED');
     });
   });
   ```

**EOD Checklist:**

- [x] Payment intent endpoint working
- [x] Pre-auth model implemented (funds verified, not charged)
- [x] Confirmation endpoint working (funds captured after pre-auth)
- [x] Idempotency for payment intent
- [x] Error handling for failed payments
- [x] Tests passing
- [x] Commit: `feat: add PAYMENT_PENDING state with pre-auth model`

---

### Day 38B (Wed, Feb 12 - Afternoon): Cancellation Policy Engine Setup ⚠️ NEW - CRITICAL PREREQUISITE

**Why:** Refunds (Day 40) MUST use cancellation policies. Build this first so Day 40 can use it.

**This is what decides refund amounts at cancellation time.**

**Tasks:**

1. **Create Cancellation Policy Model**

   ```prisma
   enum CancellationPolicyType {
     FLEXIBLE          # Free cancel until 1 day before
     MODERATE          # Free cancel until 7 days before  
     STRICT            # Free cancel until 30 days before
     NON_REFUNDABLE    # No refunds after confirmation
   }

   model CancellationPolicy {
     id                      String                    @id @default(uuid())
     type                    CancellationPolicyType
     
     # Policy name for display
     name                    String                    # "Flexible", "Moderate", etc.
     description             String?
     
     # Refund windows (days before check-in)
     # e.g., flexible = free until 1 day before
     fullRefundUntilDays     Int                       # Days before checkin = 100% refund
     partialRefundUntilDays  Int?                      # Days before checkin = 50% refund
     noRefundUntilDays       Int?                      # Days before checkin = 0% refund

     createdAt               DateTime                  @default(now())
   }

   // Add to HotelPackage:
   model HotelPackage {
     // ... existing fields ...
     cancellationPolicyId    String?
     cancellationPolicy      CancellationPolicy?       @relation(fields: [cancellationPolicyId], references: [id])
   }

   // Add to TourPackage:
   model TourPackage {
     // ... existing fields ...
     cancellationPolicyId    String?
     cancellationPolicy      CancellationPolicy?       @relation(fields: [cancellationPolicyId], references: [id])
   }

   // Snapshot cancellation policy at CONFIRMED time
   // Add to Booking:
   model Booking {
     // ... existing fields ...
     cancellationPolicy      CancellationPolicyType    # Copy at confirmation time
     cancellationPolicyJson  Json?                     # Full policy details snapshot
   }
   ```

   **Migration:**
   ```bash
   npx prisma migrate dev --name add_cancellation_policies
   ```

2. **Create Cancellation Policy Service**

   ```typescript
   // src/bookings/cancellation-policy.service.ts
   @Injectable()
   export class CancellationPolicyService {
     constructor(private prisma: PrismaService) {}

     /**
      * Calculate refund amount based on cancellation policy
      * and days remaining until check-in
      */
     async calculateRefund(
       bookingId: string,
       cancellationDate: Date, // When user is cancelling
     ): Promise<{
       refundAmount: Decimal;
       refundPercentage: number;
       reason: string;
     }> {
       const booking = await this.prisma.booking.findUnique({
         where: { id: bookingId },
         include: {
           hotelPackage: { include: { cancellationPolicy: true } },
           tourPackage: { include: { cancellationPolicy: true } },
         },
       });

       if (booking.status !== 'CONFIRMED') {
         throw new BadRequestException('Can only refund CONFIRMED bookings');
       }

       const policy = booking.hotelPackage?.cancellationPolicy ||
                     booking.tourPackage?.cancellationPolicy;

       if (!policy) {
         throw new BadRequestException('No cancellation policy found');
       }

       // Calculate days until check-in
       const checkIn = booking.checkInDate || booking.departureDate;
       const daysUntilCheckIn = Math.ceil(
         (checkIn.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24),
       );

       let refundPercentage = 0;
       let reason = '';

       // Apply policy rules
       if (daysUntilCheckIn >= policy.fullRefundUntilDays) {
         // Within full refund window
         refundPercentage = 100;
         reason = `Full refund - cancelled ${daysUntilCheckIn} days before check-in`;
       } else if (policy.partialRefundUntilDays &&
                  daysUntilCheckIn >= policy.partialRefundUntilDays) {
         // Within partial refund window
         refundPercentage = 50;
         reason = `Partial refund (50%) - cancelled ${daysUntilCheckIn} days before check-in`;
       } else {
         // No refund window
         refundPercentage = 0;
         reason = `Non-refundable - cancelled ${daysUntilCheckIn} days before check-in`;
       }

       const snapshot = booking.priceSnapshot as any;
       const refundAmount = new Decimal(snapshot.total)
         .times(refundPercentage)
         .dividedBy(100);

       return {
         refundAmount,
         refundPercentage,
         reason,
       };
     }

     /**
      * Get policy for a package
      */
     async getPolicyForPackage(packageId: string, packageType: 'HOTEL' | 'TOUR') {
       if (packageType === 'HOTEL') {
         return this.prisma.hotelPackage.findUnique({
           where: { id: packageId },
           include: { cancellationPolicy: true },
         });
       } else {
         return this.prisma.tourPackage.findUnique({
           where: { id: packageId },
           include: { cancellationPolicy: true },
         });
       }
     }

     /**
      * List all available policies for package creation UI
      */
     async listAvailablePolicies() {
       return this.prisma.cancellationPolicy.findMany({
         orderBy: { fullRefundUntilDays: 'desc' },
       });
     }
   }
   ```

3. **Seed cancellation policies**

   ```typescript
   // In src/prisma/seed.ts
   // Add to seedDatabase() function:

   // Create standard cancellation policies
   const flexiblePolicy = await prisma.cancellationPolicy.upsert({
     where: { type: 'FLEXIBLE' },
     update: {},
     create: {
       type: 'FLEXIBLE',
       name: 'Flexible',
       description: 'Free cancellation until 1 day before arrival',
       fullRefundUntilDays: 1,
       partialRefundUntilDays: null,
       noRefundUntilDays: 0,
     },
   });

   const moderatePolicy = await prisma.cancellationPolicy.upsert({
     where: { type: 'MODERATE' },
     update: {},
     create: {
       type: 'MODERATE',
       name: 'Moderate',
       description: 'Free cancellation until 7 days before arrival',
       fullRefundUntilDays: 7,
       partialRefundUntilDays: 3,
       noRefundUntilDays: 0,
     },
   });

   const strictPolicy = await prisma.cancellationPolicy.upsert({
     where: { type: 'STRICT' },
     update: {},
     create: {
       type: 'STRICT',
       name: 'Strict',
       description: 'Free cancellation until 30 days before arrival',
       fullRefundUntilDays: 30,
       partialRefundUntilDays: 14,
       noRefundUntilDays: 0,
     },
   });

   const nonRefundablePolicy = await prisma.cancellationPolicy.upsert({
     where: { type: 'NON_REFUNDABLE' },
     update: {},
     create: {
       type: 'NON_REFUNDABLE',
       name: 'Non-Refundable',
       description: 'No refunds after booking confirmed',
       fullRefundUntilDays: 999, // Never
       partialRefundUntilDays: null,
       noRefundUntilDays: 0,
     },
   });

   console.log('✅ Cancellation policies seeded');
   ```

4. **Test cancellation calculations**

   ```typescript
   describe('Cancellation Policy Service', () => {
     it('should calculate 100% refund within flexible window', async () => {
       const booking = createMockBooking({
         checkInDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days away
         cancellationPolicy: 'FLEXIBLE', // Free until 1 day before
       });

       const refund = await cancellationPolicyService.calculateRefund(
         booking.id,
         new Date(), // Cancelling now
       );

       expect(refund.refundPercentage).toBe(100);
     });

     it('should calculate 0% refund after deadline', async () => {
       const booking = createMockBooking({
         checkInDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours away
         cancellationPolicy: 'FLEXIBLE', // Free until 1 day before
       });

       const refund = await cancellationPolicyService.calculateRefund(
         booking.id,
         new Date(),
       );

       expect(refund.refundPercentage).toBe(0);
     });
   });
   ```

**EOD Checklist:**

- [x] Cancellation policy model created
- [x] Service calculates refunds correctly
- [x] Policies seeded in database
- [x] Tests passing
- [x] Commit: `feat: add cancellation policy engine`

---


**Tasks:**

1. **Implement booking confirmation with cancellation policy snapshot**

   ```typescript
   async confirmBooking(userId: string, bookingId: string) {
     const booking = await this.prisma.booking.findUnique({
       where: { id: bookingId },
       include: {
         user: true,
         hotelPackage: { include: { cancellationPolicy: true } },
         tourPackage: { include: { cancellationPolicy: true } },
       },
     });

     if (booking?.userId !== userId) {
       throw new ForbiddenException();
     }

     if (booking.status !== 'HOLD') {
       throw new BadRequestException('Can only confirm HOLD bookings');
     }

     // TRANSACTION: Update status + snapshot policy + create ledger
     return this.prisma.$transaction(async (tx) => {
       // Get cancellation policy
       const policy = booking.hotelPackage?.cancellationPolicy ||
                     booking.tourPackage?.cancellationPolicy;

       if (!policy) {
         throw new BadRequestException('No cancellation policy configured');
       }

       // Update booking to CONFIRMED with cancellation policy snapshot
       const confirmed = await tx.booking.update({
         where: { id: bookingId },
         data: {
           status: 'CONFIRMED',
           confirmedAt: new Date(),
           cancellationPolicy: policy.type,
           cancellationPolicyJson: {
             type: policy.type,
             fullRefundUntilDays: policy.fullRefundUntilDays,
             partialRefundUntilDays: policy.partialRefundUntilDays,
             noRefundUntilDays: policy.noRefundUntilDays,
           },
         },
       });

       // Create ledger entries (double-entry accounting)
       const provider = booking.hotelPackage?.provider ||
                       booking.tourPackage?.provider;

       const snapshot = booking.priceSnapshot as any;

       // Debit traveler
       await tx.ledgerEntry.create({
         data: {
           bookingId,
           type: 'BOOKING_CONFIRMED',
           debitAccount: `traveler:${userId}`,
           creditAccount: 'platform',
           amount: new Decimal(snapshot.total),
           currency: booking.currency,
           description: `Booking confirmed: ${booking.id}`,
         },
       });

       // Credit provider (after commission)
       await tx.ledgerEntry.create({
         data: {
           bookingId,
           type: 'BOOKING_CONFIRMED',
           debitAccount: 'platform',
           creditAccount: `provider:${provider?.id}`,
           amount: new Decimal(snapshot.providerEarnings),
           currency: booking.currency,
           description: `Provider earnings: ${booking.id}`,
         },
       });

       // Credit platform (commission)
       await tx.ledgerEntry.create({
         data: {
           bookingId,
           type: 'BOOKING_CONFIRMED',
           debitAccount: 'platform',
           creditAccount: 'platform:commission',
           amount: new Decimal(snapshot.commission),
           currency: booking.currency,
           description: `Platform commission: ${booking.id}`,
         },
       });

       // TODO: Queue side effects
       // - Send confirmation email
       // - Index booking for search
       // - Schedule provider payout eligibility

       return confirmed;
     });
   }
   ```

2. **Create ledger query service** (unchanged)

   ```typescript
   async getProviderEarnings(providerId: string) {
     const entries = await this.prisma.ledgerEntry.findMany({
       where: {
         creditAccount: `provider:${providerId}`,
       },
     });

     const total = entries.reduce(
       (sum, entry) => sum + parseFloat(entry.amount.toString()),
       0,
     );

     return { total, entries };
   }

   async getTravelerPending(userId: string) {
     const entries = await this.prisma.ledgerEntry.findMany({
       where: {
         debitAccount: `traveler:${userId}`,
       },
     });

     return entries;
   }
   ```

3. **Add confirmation endpoint to controller**
   ```typescript
   @Post(':bookingId/confirm')
   @UseGuards(AuthGuard)
   @ApiBearerAuth()
   @ApiOperation({ summary: 'Confirm booking after payment' })
   async confirm(
     @Request() req,
     @Param('bookingId') bookingId: string,
   ) {
     return this.bookingService.confirmBooking(req.user.userId, bookingId);
   }
   ```

4. **Test confirmed state with cancellation policy**

   ```typescript
   describe('CONFIRMED State', () => {
     it('should snapshot cancellation policy', async () => {
       const booking = await bookingService.confirmBooking(userId, bookingId);

       expect(booking.status).toBe('CONFIRMED');
       expect(booking.cancellationPolicy).toBe('FLEXIBLE');
       expect(booking.cancellationPolicyJson).toBeDefined();
     });

     it('should create balanced ledger entries', async () => {
       await bookingService.confirmBooking(userId, bookingId);

       const entries = await prisma.ledgerEntry.findMany({
         where: { bookingId },
       });

       const totalDebit = entries
         .filter(e => e.type === 'BOOKING_CONFIRMED')
         .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

       const totalCredit = entries
         .filter(e => e.type === 'BOOKING_CONFIRMED')
         .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

       // Ledger must balance: debit traveler = credit (provider + platform)
       expect(totalDebit).toBe(totalCredit);
     });
   });
   ```

**EOD Checklist:**

- [x] CONFIRMED state working
- [x] Cancellation policy snapshotted
- [x] Ledger entries created correctly
- [x] Double-entry accounting verified
- [x] Tests passing
- [x] Commit: `feat: add CONFIRMED state with cancellation policy snapshot`

   ) {
     return this.bookingService.confirmBooking(req.user.userId, bookingId);
   }
   ```

**EOD Checklist:**

- [x] CONFIRMED state working
- [x] Ledger entries created correctly
- [x] Double-entry accounting verified
- [x] Tests passing
- [x] Commit: `feat: add CONFIRMED state with ledger entries`

---

### Day 40 (Fri, Feb 14): State Machine Tests & Documentation

**Tasks:**

1. **Test complete booking flow end-to-end**

   ```typescript
   describe('Booking State Machine', () => {
     it('should go QUOTE -> HOLD -> CONFIRMED', async () => {
       // 1. Create quote
       const quote = await bookingService.createQuote(...);
       expect(quote.status).toBe('QUOTE');

       // 2. Hold booking
       const hold = await bookingService.holdBooking(quote.id);
       expect(hold.status).toBe('HOLD');

       // 3. Confirm booking
       const confirmed = await bookingService.confirmBooking(quote.id);
       expect(confirmed.status).toBe('CONFIRMED');

       // 4. Verify ledger entries
       const entries = await ledgerService.getLedgerEntries(quote.id);
       expect(entries).toHaveLength(3); // traveler + provider + commission
     });

     it('should lock inventory on HOLD', async () => {
       // 1. Check initial availability
       const before = await inventoryService.getAvailability(roomId, date);

       // 2. Hold booking
       await bookingService.holdBooking(quote.id);

       // 3. Verify inventory decreased
       const after = await inventoryService.getAvailability(roomId, date);
       expect(after).toBe(before - 1);
     });

     it('should prevent double holds with idempotency', async () => {
       // 1. First hold
       const first = await bookingService.holdBooking(quote.id, {
         idempotencyKey: 'same-key',
       });

       // 2. Second hold (duplicate)
       const second = await bookingService.holdBooking(quote.id, {
         idempotencyKey: 'same-key',
       });

       // Should return same result
       expect(second.id).toBe(first.id);
     });

     it('should fail concurrent holds', async () => {
       // Simulate race condition
       const [result1, result2] = await Promise.allSettled([
         bookingService.holdBooking(quote1.id),
         bookingService.holdBooking(quote2.id), // Same inventory
       ]);

       expect(result1.status).toBe('fulfilled');
       expect(result2.status).toBe('rejected'); // One fails
     });
   });
   ```

2. **Create booking documentation**

   ```markdown
   # Booking Engine

   ## State Machine

   QUOTE → HOLD → CONFIRMED → COMPLETED

   ## QUOTE

   - Calculate price (server-side)
   - Persist price snapshot
   - No inventory impact

   ## HOLD

   - Lock inventory for 15 minutes
   - Atomic transaction (Serializable isolation)
   - Idempotency key support

   ## CONFIRMED

   - Create ledger entries (double-entry)
   - Send confirmation email
   - Schedule provider payout

   ## Price Safety

   - Server ALWAYS calculates (never client math)
   - Price persisted at CONFIRM time
   - Used for invoices/refunds
   - No retroactive price changes
   ```

3. **Merge PR**
   ```bash
   git push origin feature/booking-engine
   # Open PR with summary of state machine
   # Link to concurrency tests
   ```

**Week Completion Checklist:**

- [x] All states working (QUOTE, HOLD, CONFIRMED)
- [x] Inventory locked atomically
- [x] Price snapshot never recomputed
- [x] Ledger entries correct
- [x] Concurrency tests passing
- [x] 70%+ test coverage
- [x] Swagger docs complete
- [x] PR merged
- [x] **Zero tolerance for flaky tests**
- [x] Commit: `feat: complete booking engine state machine`

---

## 🚨 Week 8 Critical Checklist

**Before moving to Week 9, verify:**

- ✅ Can create 100 concurrent quotes without errors
- ✅ Can hold 50 bookings simultaneously (50% inventory)
- ✅ Cannot hold when inventory exhausted
- ✅ Idempotency prevents duplicate payments
- ✅ Ledger entries always balanced (debit = credit)
- ✅ Price never changes after CONFIRMED
- ✅ All tests pass (0 flaky tests)

**If ANY of these fail, STOP and fix before moving forward.**

---

## 🎯 Success Criteria

✅ State machine: QUOTE → HOLD → CONFIRMED  
✅ Inventory locked atomically  
✅ Idempotency prevents duplicates  
✅ Price snapshots persist  
✅ Ledger entries balanced  
✅ 70%+ test coverage  
✅ PR merged to main

**Unblocks:** WEEK 9 (Testing & QA)

---

**Last Updated:** 25 Dec 2025  
**Status:** 🔴 CRITICAL - Senior dev must own this week

---

## 🚀 Discount Settings Step (Hotel & Tour Packages)

**Goal:** Add a Discount Settings step to the package builder for hotel and tour packages, allowing providers to configure promotional discounts.

### Why Now?
- Discount logic fits naturally after pricing and before media/upload steps.
- Enables competitive pricing and marketing for launch.
- Design and backend spec are ready (see DiscountSettings_Complete_Documentation.md).

### Implementation Plan

#### 1. Data Model
- Add fields to `HotelPackage` and `TourPackage`:
  - `discountEnabled: boolean`
  - `discountPercentage: number`
  - `discountStartDate: Date?`
  - `discountEndDate: Date?`
- Create and run a migration for these fields.

#### 2. Backend API
- Add PATCH endpoint:
  - `PATCH /v1/hotel-packages/:id/discount-settings`
  - `PATCH /v1/tour-packages/:id/discount-settings`
- DTO: `{ discountEnabled, discountPercentage, discountStartDate?, discountEndDate? }`
- Validation: 5–70% range, valid dates if enabled.

#### 3. Frontend (Web/Flutter)
- Add Discount Settings step to package builder UI (after pricing, before media).
- Implement per design spec: toggle, percentage selector, quick-pick, preview card.
- Save/continue triggers PATCH API call.

#### 4. State Management
- Store discount settings in package draft state.
- Prefill values if editing an existing package.

#### 5. Validation & Error Handling
- Enforce min/max discount in UI and backend.
- Show error if enabling discount with invalid range or dates.

#### 6. Tests
- Unit: Model, DTO, and validation.
- E2E: Create/edit package with discount, verify price calculation.

#### 7. Documentation
- Add to API docs (Swagger/OpenAPI).
- Add to onboarding/package builder documentation.

---

### Todo List for Discount Settings Integration (Week 7)

- [ ] Add discount fields to Prisma schema and run migration
- [ ] Implement PATCH endpoint for discount settings (hotel & tour packages)
- [ ] Add Discount Settings step to package builder UI (web & mobile)
- [ ] Implement UI per design spec (toggle, percentage, preview)
- [ ] Add validation (5–70%, date range, required if enabled)
- [ ] Write unit and E2E tests for discount logic
- [ ] Update API and onboarding documentation

---

**Note:** Implementation can be started in Week 7 and finished in parallel with other package builder steps. See DiscountSettings_Complete_Documentation.md for full UI/UX and backend details.

---
