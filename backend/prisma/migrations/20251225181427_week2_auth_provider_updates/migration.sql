/*
  Warnings:

  - The values [GUEST,PROVIDER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING] on the enum `VerificationStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `businessType` on the `ProviderProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,providerType]` on the table `ProviderProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerType` to the `ProviderProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('HOTEL_MANAGER', 'TOUR_OPERATOR');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('TRAVELER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'TRAVELER';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VerificationStatus_new" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');
ALTER TABLE "ProviderProfile" ALTER COLUMN "verificationStatus" DROP DEFAULT;
ALTER TABLE "ProviderProfile" ALTER COLUMN "verificationStatus" TYPE "VerificationStatus_new" USING ("verificationStatus"::text::"VerificationStatus_new");
ALTER TYPE "VerificationStatus" RENAME TO "VerificationStatus_old";
ALTER TYPE "VerificationStatus_new" RENAME TO "VerificationStatus";
DROP TYPE "VerificationStatus_old";
ALTER TABLE "ProviderProfile" ALTER COLUMN "verificationStatus" SET DEFAULT 'NOT_STARTED';
COMMIT;

-- DropIndex
DROP INDEX "ProviderProfile_userId_key";

-- AlterTable
ALTER TABLE "ProviderProfile" DROP COLUMN "businessType",
ADD COLUMN     "providerType" "ProviderType" NOT NULL,
ALTER COLUMN "businessName" DROP NOT NULL,
ALTER COLUMN "verificationStatus" SET DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'TRAVELER';

-- CreateTable
CREATE TABLE "AuthOtp" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderOnboarding" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" JSONB,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthOtp_target_channel_idx" ON "AuthOtp"("target", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderOnboarding_providerId_key" ON "ProviderOnboarding"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_userId_providerType_key" ON "ProviderProfile"("userId", "providerType");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");
