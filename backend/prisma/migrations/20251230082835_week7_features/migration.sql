-- AlterTable
ALTER TABLE "HotelPackage" ADD COLUMN     "discountEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discountEndDate" TIMESTAMP(3),
ADD COLUMN     "discountPercentage" DECIMAL(5,2),
ADD COLUMN     "discountStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TourPackage" ADD COLUMN     "complianceLiabilityAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "complianceTermsAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discountEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discountEndDate" TIMESTAMP(3),
ADD COLUMN     "discountPercentage" DECIMAL(5,2),
ADD COLUMN     "discountStartDate" TIMESTAMP(3),
ADD COLUMN     "healthRequirements" TEXT,
ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "insuranceInfo" TEXT,
ADD COLUMN     "safetyInformation" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "specialNotes" TEXT;

-- CreateTable
CREATE TABLE "AddOn" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AddOn_packageId_idx" ON "AddOn"("packageId");

-- AddForeignKey
ALTER TABLE "AddOn" ADD CONSTRAINT "AddOn_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
