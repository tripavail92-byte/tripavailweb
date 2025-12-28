# WEEK 6: Tour Packages Part 1 (Steps 1–7)

This file is intentionally aligned to the **current repo state** (NestJS + Prisma) and the **actual Prisma schema** in [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

## Goal

Implement the Tour Package builder persistence for Steps 1–7:

1. Trip type
2. Basics
3. Departures (dates + seat inventory)
4. Pickups (map pins)
5. Highlights
6. Itinerary days
7. Inclusions / Exclusions

## Status (Implemented)

**Data model additions (migration):**

- `TourPackage.highlights`, `TourPackage.inclusions`, `TourPackage.exclusions` (all `String[]` default `[]`)
- `ItineraryDay` unique per package/day (`@@unique([packageId, day])`)

Migration: [backend/prisma/migrations/20251226120000_week6_tour_package_steps_fields/migration.sql](backend/prisma/migrations/20251226120000_week6_tour_package_steps_fields/migration.sql)

**API (Step endpoints):**

All Step 1–7 endpoints are provider-scoped and guarded by `JwtAuthGuard` + `ProviderOwnerGuard`.

- `POST /v1/tour-packages/:providerId/packages/step1`
- `PATCH /v1/tour-packages/:providerId/packages/:id/step2-basics`
- `PUT /v1/tour-packages/:providerId/packages/:id/step3-departures` (replace-all)
- `PUT /v1/tour-packages/:providerId/packages/:id/step4-pickups` (replace-all)
- `PATCH /v1/tour-packages/:providerId/packages/:id/step5-highlights`
- `PUT /v1/tour-packages/:providerId/packages/:id/step6-itinerary` (replace-all)
- `PATCH /v1/tour-packages/:providerId/packages/:id/step7-inclusions-exclusions`

Implementation: [backend/src/listings/tour_packages/tour-packages.controller.ts](backend/src/listings/tour_packages/tour-packages.controller.ts)

**Read model:**

- `GET /v1/tour-packages/:id` includes `itinerary`, `pickups`, and `departures` for UI prefill.

Implementation: [backend/src/listings/tour_packages/tour-packages.service.ts](backend/src/listings/tour_packages/tour-packages.service.ts)

## Notes / Constraints

- Step endpoints only allow edits while `status === DRAFT`.
- Step 1 creates a DRAFT row with minimal placeholder values (`name`, `description`, etc.) because those columns are required in the current schema.
- `tripType` remains a string for now (no Prisma enum yet).

## Tests

- End-to-end coverage for building a DRAFT package through steps 1–7:
  [backend/test/tour-packages.steps.e2e.spec.ts](backend/test/tour-packages.steps.e2e.spec.ts)

## Next (Week 7+)

- Publish/pause/archive lifecycle (gated by provider verification)
- Media upload, add-ons, policies, preview/publish success
  },
  });
  }

  async step3DatesAndDeparture(
  providerId: string,
  packageId: string,
  dto: Step3DatesAndDepartureDto,
  ) {
  const pkg = await this.prisma.tourPackage.findUnique({
  where: { id: packageId },
  });

       if (pkg?.providerId !== providerId) {
         throw new ForbiddenException();
       }

       // Create departures
       const departures = await Promise.all(
         dto.departureDates.map((date) =>
           this.prisma.tourDeparture.create({
             data: {
               tourPackageId: packageId,
               departureDate: new Date(date),
               availableSeats: dto.availableSeatsPerDeparture,
               price: new Decimal(dto.pricePerDeparture),
             },
           }),
         ),
       );

       return departures;

  }
  }

  ```

  ```

**EOD Checklist:**

- [ ] TourPackage, ItineraryDay, TourDeparture models migrated
- [ ] DTOs created
- [ ] Service implementing Steps 1-3
- [ ] Tests passing
- [ ] Commit: `feat: add tour package models and steps 1-3`

---

### Day 27 (Tue, Jan 28): Steps 4-5 (Pickups & Highlights)

**Tasks:**

1. **Create pickup endpoints with map integration**

   ```typescript
   // Add to tour-packages.service.ts
   async step4Pickups(
     providerId: string,
     packageId: string,
     pickups: CreatePickupDto[],
   ) {
     const pkg = await this.prisma.tourPackage.findUnique({
       where: { id: packageId },
     });

     if (pkg?.providerId !== providerId) {
       throw new ForbiddenException();
     }

     // Delete existing pickups
     await this.prisma.pickup.deleteMany({
       where: { tourPackageId: packageId },
     });

     // Create new pickups
     return Promise.all(
       pickups.map((p) =>
         this.prisma.pickup.create({
           data: {
             tourPackageId: packageId,
             location: p.location,
             latitude: p.latitude,
             longitude: p.longitude,
             time: p.time,
             optional: p.optional || false,
           },
         }),
       ),
     );
   }
   ```

   ```typescript
   // Add DTOs
   export class CreatePickupDto {
     @IsString()
     location: string;

     @IsNumber()
     @Min(-90)
     @Max(90)
     latitude: number;

     @IsNumber()
     @Min(-180)
     @Max(180)
     longitude: number;

     @IsString()
     @Matches(/^\d{2}:\d{2}$/)
     time: string; // "09:00"

     @IsBoolean()
     @IsOptional()
     optional?: boolean;
   }

   export class Step5HighlightsDto {
     @IsArray()
     @IsString({ each: true })
     @MinLength(1, { each: true })
     highlights: string[]; // ["Mountain trekking", "Local cuisine"]
   }
   ```

2. **Implement highlights step**

   ```typescript
   async step5Highlights(
     providerId: string,
     packageId: string,
     dto: Step5HighlightsDto,
   ) {
     const pkg = await this.prisma.tourPackage.findUnique({
       where: { id: packageId },
     });

     if (pkg?.providerId !== providerId) {
       throw new ForbiddenException();
     }

     return this.prisma.tourPackage.update({
       where: { id: packageId },
       data: { highlights: dto.highlights },
     });
   }
   ```

3. **Create controller endpoints**

   ```typescript
   // src/tour-packages/tour-packages.controller.ts
   @Post(':packageId/step4-pickups')
   async step4(
     @Request() req,
     @Param('packageId') packageId: string,
     @Body() dto: CreatePickupDto[],
   ) {
     const profile = await this.getProviderProfile(req.user.userId);
     return this.tourService.step4Pickups(profile.id, packageId, dto);
   }

   @Post(':packageId/step5-highlights')
   async step5(
     @Request() req,
     @Param('packageId') packageId: string,
     @Body() dto: Step5HighlightsDto,
   ) {
     const profile = await this.getProviderProfile(req.user.userId);
     return this.tourService.step5Highlights(profile.id, packageId, dto);
   }
   ```

**EOD Checklist:**

- [ ] Pickup CRUD working
- [ ] Map coordinates validated
- [ ] Highlights step working
- [ ] Tests passing
- [ ] Commit: `feat: add tour package steps 4-5`

---

### Day 28 (Wed, Jan 29): Step 6 (Itinerary Builder)

**Tasks:**

1. **Create itinerary day builder**

   ```typescript
   // Add DTOs
   export class CreateItineraryDayDto {
     @IsNumber()
     dayNumber: number;

     @IsString()
     title: string;

     @IsString()
     description: string;

     @IsArray()
     @IsString({ each: true })
     activities: string[];

     @IsArray()
     @IsEnum(['Breakfast', 'Lunch', 'Dinner'], { each: true })
     meals: string[];

     @IsString()
     @IsOptional()
     accommodation?: string;
   }

   export class Step6ItineraryDto {
     @ValidateNested({ each: true })
     @Type(() => CreateItineraryDayDto)
     days: CreateItineraryDayDto[];
   }
   ```

2. **Implement itinerary service**

   ```typescript
   // Add to tour-packages.service.ts
   async step6Itinerary(
     providerId: string,
     packageId: string,
     dto: Step6ItineraryDto,
   ) {
     const pkg = await this.prisma.tourPackage.findUnique({
       where: { id: packageId },
     });

     if (pkg?.providerId !== providerId) {
       throw new ForbiddenException();
     }

     // Delete existing days
     await this.prisma.itineraryDay.deleteMany({
       where: { tourPackageId: packageId },
     });

     // Create new days
     return Promise.all(
       dto.days.map((day) =>
         this.prisma.itineraryDay.create({
           data: {
             tourPackageId: packageId,
             dayNumber: day.dayNumber,
             title: day.title,
             description: day.description,
             activities: day.activities,
             meals: day.meals,
             accommodation: day.accommodation,
           },
         }),
       ),
     );
   }
   ```

3. **Add controller endpoint**
   ```typescript
   @Post(':packageId/step6-itinerary')
   async step6(
     @Request() req,
     @Param('packageId') packageId: string,
     @Body() dto: Step6ItineraryDto,
   ) {
     const profile = await this.getProviderProfile(req.user.userId);
     return this.tourService.step6Itinerary(profile.id, packageId, dto);
   }
   ```

**EOD Checklist:**

- [ ] Itinerary days CRUD working
- [ ] Day ordering validated
- [ ] Tests passing
- [ ] Commit: `feat: add tour package step 6 itinerary builder`

---

### Day 29 (Thu, Jan 30): Step 7 (Inclusions/Exclusions)

**Tasks:**

1. **Create inclusions/exclusions DTO**

   ```typescript
   export class Step7InclusionsExclusionsDto {
     @IsArray()
     @IsString({ each: true })
     inclusions: string[];

     @IsArray()
     @IsString({ each: true })
     exclusions: string[];
   }
   ```

2. **Implement step 7**

   ```typescript
   async step7InclusionsExclusions(
     providerId: string,
     packageId: string,
     dto: Step7InclusionsExclusionsDto,
   ) {
     const pkg = await this.prisma.tourPackage.findUnique({
       where: { id: packageId },
     });

     if (pkg?.providerId !== providerId) {
       throw new ForbiddenException();
     }

     return this.prisma.tourPackage.update({
       where: { id: packageId },
       data: {
         inclusions: dto.inclusions,
         exclusions: dto.exclusions,
       },
     });
   }
   ```

3. **Add controller endpoint**

   ```typescript
   @Post(':packageId/step7-inclusions')
   async step7(
     @Request() req,
     @Param('packageId') packageId: string,
     @Body() dto: Step7InclusionsExclusionsDto,
   ) {
     const profile = await this.getProviderProfile(req.user.userId);
     return this.tourService.step7InclusionsExclusions(profile.id, packageId, dto);
   }
   ```

4. **Test all steps 1-7**
   - Ensure steps must be done in order
   - Validate data at each step

**EOD Checklist:**

- [ ] Steps 1-7 all working
- [ ] End-to-end flow tested
- [ ] Tests passing
- [ ] Commit: `feat: add tour package step 7 inclusions/exclusions`

---

### Day 30 (Fri, Jan 31): Testing & Documentation

**Tasks:**

1. **Complete integration tests (70%+ coverage)**
2. **Test step progression logic**
3. **Create tour packages documentation**
4. **Performance testing & optimization**
5. **Merge PR**

**Week Completion Checklist:**

- [ ] Steps 1-7 all working
- [ ] Step progression validated
- [ ] 70%+ test coverage
- [ ] Swagger docs complete
- [ ] PR merged
- [ ] Commit: `feat: complete tour packages steps 1-7`

---

## 🎯 Success Criteria

✅ All 7 steps persisting data  
✅ Steps must be done in order  
✅ Itinerary days auto-validate against duration  
✅ Map integration for pickups  
✅ 70%+ test coverage  
✅ PR merged to main

**Unblocks:** Week 7 (Tour Packages Part 2: Steps 8-14)

---

**Last Updated:** 25 Dec 2025  
**Status:** 🟠 Ready to start Jan 27
