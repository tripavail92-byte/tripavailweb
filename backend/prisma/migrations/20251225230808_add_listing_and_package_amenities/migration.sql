-- CreateTable
CREATE TABLE "ListingAmenity" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelPackageAmenity" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelPackageAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingAmenity_amenityId_idx" ON "ListingAmenity"("amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingAmenity_listingId_amenityId_key" ON "ListingAmenity"("listingId", "amenityId");

-- CreateIndex
CREATE INDEX "HotelPackageAmenity_amenityId_idx" ON "HotelPackageAmenity"("amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelPackageAmenity_packageId_amenityId_key" ON "HotelPackageAmenity"("packageId", "amenityId");

-- AddForeignKey
ALTER TABLE "ListingAmenity" ADD CONSTRAINT "ListingAmenity_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAmenity" ADD CONSTRAINT "ListingAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelPackageAmenity" ADD CONSTRAINT "HotelPackageAmenity_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "HotelPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelPackageAmenity" ADD CONSTRAINT "HotelPackageAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
