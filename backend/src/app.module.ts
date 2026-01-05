import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PartnersModule } from './partners/partners.module';
import { RbacModule } from './rbac/rbac.module';
import { ProviderOnboardingModule } from './provider_onboarding/provider_onboarding.module';
import { OperatorProfileModule } from './operator_profile/operator-profile.module';
import { KycModule } from './kyc/kyc.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { ProvidersModule } from './providers/providers.module';
import { StaysModule } from './listings/stays/stays.module';
import { AmenitiesModule } from './listings/amenities/amenities.module';
import { HotelPackagesModule } from './listings/hotel_packages/hotel-packages.module';
import { TourPackagesModule } from './listings/tour_packages/tour-packages.module';
import { HostModule } from './host/host.module';
import { BookingsModule } from './bookings/bookings.module';
import { PricingService } from './pricing/pricing.service';
import { PaymentsModule } from './payments/payments.module';
import { CancellationModule } from './cancellation/cancellation.module';
import { LedgerModule } from './ledger/ledger.module';
import { RefundsModule } from './refunds/refunds.module';
import { PayoutsModule } from './payouts/payouts.module';
import { DisputesModule } from './disputes/disputes.module';

@Module({
  imports: [
    // Environment variables configuration
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available globally
      envFilePath: '.env',
    }),

    // Cron jobs for hold expiration, etc.
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute for authenticated users
      },
    ]),
    HealthModule,
    AuthModule,
    PartnersModule,
    RbacModule,
    ProvidersModule,
    ProviderOnboardingModule,
    OperatorProfileModule,
    KycModule,
    AuditModule,
    AdminModule,
    // Listings domain scaffolding (Week 4)
    StaysModule,
    AmenitiesModule,
    HotelPackagesModule,
    TourPackagesModule,
    HostModule,
    BookingsModule,
    PaymentsModule,
    CancellationModule,
    LedgerModule,
    RefundsModule,
    PayoutsModule,
    DisputesModule,
  ],
  controllers: [AppController],
  providers: [AppService, PricingService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Use a named wildcard to satisfy path-to-regexp v6
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
