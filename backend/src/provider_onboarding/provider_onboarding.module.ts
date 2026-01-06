import { Module } from '@nestjs/common';
import { ProviderOnboardingController } from './provider_onboarding.controller';
import { ProviderOnboardingService } from './provider_onboarding.service';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ProviderOnboardingController],
  providers: [ProviderOnboardingService, PrismaService],
  exports: [ProviderOnboardingService],
})
export class ProviderOnboardingModule {}
