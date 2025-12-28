-- AddForeignKey
ALTER TABLE "ProviderOnboarding" ADD CONSTRAINT "ProviderOnboarding_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
