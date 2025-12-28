-- Add fields needed for Tour Packages builder Steps 1-7

ALTER TABLE "TourPackage"
ADD COLUMN "highlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "inclusions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "exclusions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Ensure itinerary day is unique per package
ALTER TABLE "ItineraryDay"
ADD CONSTRAINT "ItineraryDay_packageId_day_key" UNIQUE ("packageId", "day");
