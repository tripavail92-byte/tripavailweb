# WEEK 7: Tour Packages Part 2 (Days 31-35) + WEEK 8: Booking Engine (Days 36-40)

**Dates:** Feb 3-14, 2026  
**Team:** 1 Senior (critical), 1 Mid-level  
**Critical Path:** YES ⚠️

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

- [ ] Step 8-9 endpoints working
- [ ] Tests passing
- [ ] Commit: `feat: add tour package steps 8-9`

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

- [ ] Step 10-11 endpoints working
- [ ] All tests passing
- [ ] Commit: `feat: add tour package steps 10-11`

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

- [ ] Step 12-13 endpoints working
- [ ] Preview includes all data
- [ ] Tests passing
- [ ] Commit: `feat: add tour package steps 12-13 compliance and preview`

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

- [ ] Publish endpoint working
- [ ] Verification gate enforced
- [ ] All 14 steps tested end-to-end
- [ ] Tests passing
- [ ] Commit: `feat: add tour package step 14 publish with gate`

---

### Day 35 (Fri, Feb 7): Testing, Documentation & PR

**Tasks:**

1. **Complete integration tests (70%+ coverage)**
2. **Test all 14 steps end-to-end flow**
3. **Create tour packages documentation** (Steps 1-14)
4. **Performance testing & optimization**
5. **Merge PR**

**Week Completion Checklist:**

- [ ] All 14 steps working
- [ ] Step progression validated
- [ ] Publishing gate verified
- [ ] 70%+ test coverage
- [ ] Swagger docs complete
- [ ] PR merged
- [ ] Commit: `feat: complete tour packages steps 8-14 with publishing gate`

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

- [ ] Booking model migrated
- [ ] Quote creation working
- [ ] Price snapshot captured (never client math)
- [ ] Tests passing
- [ ] Commit: `feat: add booking model and quote state`

---

### Day 37 (Tue, Feb 11): HOLD State & Inventory Locking

**Tasks:**

1. **Create HOLD endpoint with atomic inventory lock**

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
       if (existing) {
         return existing; // Return cached result
       }
     }

     // ATOMIC TRANSACTION: Lock inventory
     return this.prisma.$transaction(async (tx) => {
       if (booking.hotelPackageId) {
         // Lock hotel rooms
         const result = await tx.$queryRaw`
           UPDATE inventory_nights
           SET available_units = available_units - ${booking.numberOfRooms}
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
         // Lock tour seats
         const result = await tx.$queryRaw`
           UPDATE tour_departures
           SET available_seats = available_seats - ${booking.numberOfGuests}
           WHERE tour_package_id = ${booking.tourPackageId}
             AND departure_date = ${booking.departureDate}
             AND available_seats >= ${booking.numberOfGuests}
           RETURNING id;
         `;

         if (!result || result.length === 0) {
           throw new BadRequestException('Insufficient seats available');
         }
       }

       // Update booking to HOLD with TTL
       const updated = await tx.booking.update({
         where: { id: dto.bookingId },
         data: {
           status: 'HOLD',
           holdExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min TTL
           idempotencyKey: dto.idempotencyKey,
           heldAt: new Date(),
         },
       });

       // TODO: Queue hold expiry job
       // this.jobQueue.add('expire-hold', { bookingId }, {
       //   delay: 15 * 60 * 1000,
       // });

       return updated;
     }, {
       isolationLevel: 'Serializable', // Strongest isolation
     });
   }
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

- [ ] HOLD endpoint working
- [ ] Inventory locked atomically
- [ ] Idempotency working
- [ ] Concurrency tests passing
- [ ] Commit: `feat: add HOLD state with atomic inventory locking`

---

### Day 38 (Wed, Feb 12): PAYMENT State & Stripe Integration Stub

**Tasks:**

1. **Create payment intent endpoint**

   ```typescript
   export class CreatePaymentIntentDto {
     @IsString()
     bookingId: string;

     @IsString()
     @IsOptional()
     idempotencyKey?: string;
   }

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

     // Idempotency check
     if (dto.idempotencyKey && booking.payment?.paymentIntentId) {
       return { paymentIntentId: booking.payment.paymentIntentId };
     }

     // Create Stripe payment intent (stub for Week 11)
     const paymentIntentId = `pi_${Date.now()}`; // Mock ID

     // Store intent
     const payment = await this.prisma.payment.upsert({
       where: { bookingId: dto.bookingId },
       update: { paymentIntentId },
       create: {
         bookingId: dto.bookingId,
         amount: booking.totalPrice,
         currency: booking.currency,
         paymentIntentId,
         status: 'PENDING',
       },
     });

     return { paymentIntentId };
   }
   ```

2. **Create payment confirmation endpoint**

   ```typescript
   async confirmPayment(userId: string, bookingId: string) {
     const booking = await this.prisma.booking.findUnique({
       where: { id: bookingId },
       include: { payment: true },
     });

     if (booking?.userId !== userId) {
       throw new ForbiddenException();
     }

     if (booking.status !== 'HOLD') {
       throw new BadRequestException();
     }

     // TODO: Verify payment with Stripe (Week 11)
     // const stripePayment = await stripe.paymentIntents.retrieve(...);
     // if (stripePayment.status !== 'succeeded') throw error;

     // For now, assume success
     return this.confirmBooking(userId, bookingId);
   }
   ```

3. **Add payment endpoints to controller**

   ```typescript
   @Post(':bookingId/payment/intent')
   async createIntent(
     @Request() req,
     @Param('bookingId') bookingId: string,
     @Body() dto: CreatePaymentIntentDto,
   ) {
     return this.bookingService.createPaymentIntent(req.user.userId, {
       ...dto,
       bookingId,
     });
   }

   @Post(':bookingId/payment/confirm')
   async confirmPayment(
     @Request() req,
     @Param('bookingId') bookingId: string,
   ) {
     return this.bookingService.confirmPayment(req.user.userId, bookingId);
   }
   ```

**EOD Checklist:**

- [ ] Payment intent endpoint working
- [ ] Idempotency for payment intent
- [ ] Confirmation endpoint working
- [ ] Tests passing
- [ ] Commit: `feat: add PAYMENT_PENDING state with payment intent`

---

### Day 39 (Thu, Feb 13): CONFIRMED State & Ledger Entries

**Tasks:**

1. **Implement booking confirmation**

   ```typescript
   async confirmBooking(userId: string, bookingId: string) {
     const booking = await this.prisma.booking.findUnique({
       where: { id: bookingId },
       include: {
         user: true,
         hotelPackage: { include: { provider: true } },
         tourPackage: { include: { provider: true } },
       },
     });

     if (booking?.userId !== userId) {
       throw new ForbiddenException();
     }

     if (booking.status !== 'HOLD') {
       throw new BadRequestException('Can only confirm HOLD bookings');
     }

     // TRANSACTION: Update status + create ledger
     return this.prisma.$transaction(async (tx) => {
       // Update booking
       const confirmed = await tx.booking.update({
         where: { id: bookingId },
         data: {
           status: 'CONFIRMED',
           confirmedAt: new Date(),
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

2. **Create ledger query service**

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
   async confirm(
     @Request() req,
     @Param('bookingId') bookingId: string,
   ) {
     return this.bookingService.confirmBooking(req.user.userId, bookingId);
   }
   ```

**EOD Checklist:**

- [ ] CONFIRMED state working
- [ ] Ledger entries created correctly
- [ ] Double-entry accounting verified
- [ ] Tests passing
- [ ] Commit: `feat: add CONFIRMED state with ledger entries`

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

- [ ] All states working (QUOTE, HOLD, CONFIRMED)
- [ ] Inventory locked atomically
- [ ] Price snapshot never recomputed
- [ ] Ledger entries correct
- [ ] Concurrency tests passing
- [ ] 70%+ test coverage
- [ ] Swagger docs complete
- [ ] PR merged
- [ ] **Zero tolerance for flaky tests**
- [ ] Commit: `feat: complete booking engine state machine`

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
