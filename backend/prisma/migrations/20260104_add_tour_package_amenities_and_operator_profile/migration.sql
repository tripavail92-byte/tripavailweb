-- CreateTable TourPackageAmenity
CREATE TABLE "TourPackageAmenity" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourPackageAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable OperatorProfile
CREATE TABLE "OperatorProfile" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "baseCity" TEXT,
    "baseLatitude" DOUBLE PRECISION,
    "baseLongitude" DOUBLE PRECISION,
    "meetingPoint" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex TourPackageAmenity
CREATE UNIQUE INDEX "TourPackageAmenity_packageId_amenityId_key" ON "TourPackageAmenity"("packageId", "amenityId");
CREATE INDEX "TourPackageAmenity_amenityId_idx" ON "TourPackageAmenity"("amenityId");

-- CreateIndex OperatorProfile
CREATE UNIQUE INDEX "OperatorProfile_providerId_key" ON "OperatorProfile"("providerId");
CREATE INDEX "OperatorProfile_providerId_idx" ON "OperatorProfile"("providerId");

-- AddForeignKey TourPackageAmenity
ALTER TABLE "TourPackageAmenity" ADD CONSTRAINT "TourPackageAmenity_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "TourPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TourPackageAmenity" ADD CONSTRAINT "TourPackageAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey OperatorProfile
ALTER TABLE "OperatorProfile" ADD CONSTRAINT "OperatorProfile_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
