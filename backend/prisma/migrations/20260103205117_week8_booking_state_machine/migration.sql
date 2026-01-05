/*
  Warnings:

  - You are about to drop the column `checkIn` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `checkOut` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `guests` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `productType` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `account` on the `LedgerEntry` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `providerTxnId` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymentIntentId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `numberOfGuests` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creditAccount` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `debitAccount` to the `LedgerEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CancellationPolicyType" AS ENUM ('FLEXIBLE', 'MODERATE', 'STRICT', 'NON_REFUNDABLE');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- DropForeignKey
ALTER TABLE "LedgerEntry" DROP CONSTRAINT "LedgerEntry_bookingId_fkey";

-- DropIndex
DROP INDEX "Booking_providerId_idx";

-- DropIndex
DROP INDEX "LedgerEntry_account_idx";

-- DropIndex
DROP INDEX "Payment_provider_idx";

-- AlterTable
-- Handle existing Booking data first
ALTER TABLE "Booking" ADD COLUMN "numberOfGuests" INTEGER;
UPDATE "Booking" SET "numberOfGuests" = "guests" WHERE "guests" IS NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "numberOfGuests" SET NOT NULL;

-- Migrate old fields to new fields
ALTER TABLE "Booking" ADD COLUMN "checkInDate" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "checkOutDate" TIMESTAMP(3);
UPDATE "Booking" SET "checkInDate" = "checkIn", "checkOutDate" = "checkOut";

-- Drop old columns
ALTER TABLE "Booking" DROP COLUMN "checkIn",
DROP COLUMN "checkOut",
DROP COLUMN "guests",
DROP COLUMN "productId",
DROP COLUMN "productType",
DROP COLUMN "providerId",
ADD COLUMN     "cancellationPolicy" "CancellationPolicyType",
ADD COLUMN     "cancellationPolicyJson" JSONB,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "departureDate" TIMESTAMP(3),
ADD COLUMN     "heldAt" TIMESTAMP(3),
ADD COLUMN     "hotelPackageId" TEXT,
ADD COLUMN     "lastPaymentError" TEXT,
ADD COLUMN     "numberOfRooms" INTEGER,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentMethodId" TEXT,
ADD COLUMN     "quotedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "selectedAddOns" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "selectedRoomIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tourPackageId" TEXT,
ALTER COLUMN "totalPrice" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "HotelPackage" ADD COLUMN     "cancellationPolicyId" TEXT;

-- AlterTable
ALTER TABLE "InventoryNight" ADD COLUMN     "lockedUntil" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
-- Handle existing LedgerEntry data first
ALTER TABLE "LedgerEntry" ADD COLUMN "debitAccount" TEXT;
ALTER TABLE "LedgerEntry" ADD COLUMN "creditAccount" TEXT;
UPDATE "LedgerEntry" SET "debitAccount" = "account", "creditAccount" = 'platform' WHERE "account" IS NOT NULL;
ALTER TABLE "LedgerEntry" ALTER COLUMN "debitAccount" SET NOT NULL;
ALTER TABLE "LedgerEntry" ALTER COLUMN "creditAccount" SET NOT NULL;

ALTER TABLE "LedgerEntry" DROP COLUMN "account",
ADD COLUMN     "metadata" JSONB,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "provider",
DROP COLUMN "providerTxnId",
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "paymentMethodId" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "status" SET DEFAULT 'PRE_AUTHORIZED';

-- AlterTable
ALTER TABLE "TourDeparture" ADD COLUMN     "lockedUntil" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "TourPackage" ADD COLUMN     "cancellationPolicyId" TEXT;

-- CreateTable
CREATE TABLE "CancellationPolicy" (
    "id" TEXT NOT NULL,
    "type" "CancellationPolicyType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fullRefundUntilDays" INTEGER NOT NULL,
    "partialRefundUntilDays" INTEGER,
    "noRefundUntilDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CancellationPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CancellationPolicy_type_key" ON "CancellationPolicy"("type");

-- CreateIndex
CREATE INDEX "Booking_hotelPackageId_idx" ON "Booking"("hotelPackageId");

-- CreateIndex
CREATE INDEX "Booking_tourPackageId_idx" ON "Booking"("tourPackageId");

-- CreateIndex
CREATE INDEX "Booking_holdExpiresAt_idx" ON "Booking"("holdExpiresAt");

-- CreateIndex
CREATE INDEX "InventoryNight_lockedUntil_idx" ON "InventoryNight"("lockedUntil");

-- CreateIndex
CREATE INDEX "LedgerEntry_debitAccount_idx" ON "LedgerEntry"("debitAccount");

-- CreateIndex
CREATE INDEX "LedgerEntry_creditAccount_idx" ON "LedgerEntry"("creditAccount");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentIntentId_key" ON "Payment"("paymentIntentId");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_paymentIntentId_idx" ON "Payment"("paymentIntentId");

-- CreateIndex
CREATE INDEX "TourDeparture_lockedUntil_idx" ON "TourDeparture"("lockedUntil");

-- AddForeignKey
ALTER TABLE "HotelPackage" ADD CONSTRAINT "HotelPackage_cancellationPolicyId_fkey" FOREIGN KEY ("cancellationPolicyId") REFERENCES "CancellationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TourPackage" ADD CONSTRAINT "TourPackage_cancellationPolicyId_fkey" FOREIGN KEY ("cancellationPolicyId") REFERENCES "CancellationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_hotelPackageId_fkey" FOREIGN KEY ("hotelPackageId") REFERENCES "HotelPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tourPackageId_fkey" FOREIGN KEY ("tourPackageId") REFERENCES "TourPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
