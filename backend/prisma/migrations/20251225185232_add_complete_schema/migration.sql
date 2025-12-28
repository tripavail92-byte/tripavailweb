/*
  Warnings:

  - You are about to alter the column `totalPrice` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to drop the column `title` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentIntentId` on the `Payment` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guests` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceSnapshot` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productType` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checkInTime` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checkOutTime` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'ARCHIVED');

-- DropIndex
DROP INDEX "Listing_type_idx";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "checkIn" TIMESTAMP(3),
ADD COLUMN     "checkOut" TIMESTAMP(3),
ADD COLUMN     "guests" INTEGER NOT NULL,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "priceSnapshot" JSONB NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "productType" TEXT NOT NULL,
ADD COLUMN     "providerId" TEXT NOT NULL,
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "checkInTime" TEXT NOT NULL,
ADD COLUMN     "checkOutTime" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "stripePaymentIntentId",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'STRIPE',
ADD COLUMN     "providerTxnId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "status" DROP DEFAULT;

-- DropEnum
DROP TYPE "ListingType";

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "bedConfig" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryNight" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "availableUnits" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryNight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelPackage" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'DRAFT',
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "inclusions" TEXT[],
    "exclusions" TEXT[],
    "availabilityRule" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPackage" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "tripType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'DRAFT',
    "basePrice" DECIMAL(10,2) NOT NULL,
    "maxSeats" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pickup" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourDeparture" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourDeparture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "type" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Room_listingId_idx" ON "Room"("listingId");

-- CreateIndex
CREATE INDEX "InventoryNight_date_idx" ON "InventoryNight"("date");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryNight_roomId_date_key" ON "InventoryNight"("roomId", "date");

-- CreateIndex
CREATE INDEX "HotelPackage_providerId_idx" ON "HotelPackage"("providerId");

-- CreateIndex
CREATE INDEX "HotelPackage_listingId_idx" ON "HotelPackage"("listingId");

-- CreateIndex
CREATE INDEX "HotelPackage_status_idx" ON "HotelPackage"("status");

-- CreateIndex
CREATE INDEX "TourPackage_providerId_idx" ON "TourPackage"("providerId");

-- CreateIndex
CREATE INDEX "TourPackage_status_idx" ON "TourPackage"("status");

-- CreateIndex
CREATE INDEX "ItineraryDay_packageId_idx" ON "ItineraryDay"("packageId");

-- CreateIndex
CREATE INDEX "Pickup_packageId_idx" ON "Pickup"("packageId");

-- CreateIndex
CREATE INDEX "TourDeparture_departureDate_idx" ON "TourDeparture"("departureDate");

-- CreateIndex
CREATE UNIQUE INDEX "TourDeparture_packageId_departureDate_key" ON "TourDeparture"("packageId", "departureDate");

-- CreateIndex
CREATE INDEX "LedgerEntry_bookingId_idx" ON "LedgerEntry"("bookingId");

-- CreateIndex
CREATE INDEX "LedgerEntry_account_idx" ON "LedgerEntry"("account");

-- CreateIndex
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_providerId_idx" ON "Booking"("providerId");

-- CreateIndex
CREATE INDEX "Booking_idempotencyKey_idx" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Listing_providerId_idx" ON "Listing"("providerId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_city_idx" ON "Listing"("city");

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryNight" ADD CONSTRAINT "InventoryNight_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pickup" ADD CONSTRAINT "Pickup_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourDeparture" ADD CONSTRAINT "TourDeparture_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
