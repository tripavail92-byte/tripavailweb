-- Add review tracking columns for provider verification
ALTER TABLE "ProviderProfile" ADD COLUMN "submittedAt" TIMESTAMP(3);
ALTER TABLE "ProviderProfile" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "ProviderProfile" ADD COLUMN "reviewedByAdminId" TEXT;
ALTER TABLE "ProviderProfile" ADD COLUMN "rejectionReason" TEXT;
