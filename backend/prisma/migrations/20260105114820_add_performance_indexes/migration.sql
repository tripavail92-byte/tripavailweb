-- CreateIndex
CREATE INDEX "Booking_userId_status_createdAt_idx" ON "Booking"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "HotelPackage_providerId_status_publishedAt_idx" ON "HotelPackage"("providerId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "InventoryNight_roomId_date_availableUnits_idx" ON "InventoryNight"("roomId", "date", "availableUnits");

-- CreateIndex
CREATE INDEX "LedgerEntry_debitAccount_createdAt_idx" ON "LedgerEntry"("debitAccount", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_creditAccount_createdAt_idx" ON "LedgerEntry"("creditAccount", "createdAt");

-- CreateIndex
CREATE INDEX "TourDeparture_packageId_departureDate_availableSeats_idx" ON "TourDeparture"("packageId", "departureDate", "availableSeats");

-- CreateIndex
CREATE INDEX "TourPackage_providerId_status_publishedAt_idx" ON "TourPackage"("providerId", "status", "publishedAt");
