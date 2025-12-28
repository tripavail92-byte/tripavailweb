import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PartnersModule } from './partners/partners.module';
import { RbacModule } from './rbac/rbac.module';
import { ProviderOnboardingModule } from './provider_onboarding/provider_onboarding.module';
import { KycModule } from './kyc/kyc.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { ProvidersModule } from './providers/providers.module';
import { StaysModule } from './listings/stays/stays.module';
import { AmenitiesModule } from './listings/amenities/amenities.module';
import { HotelPackagesModule } from './listings/hotel_packages/hotel-packages.module';
import { TourPackagesModule } from './listings/tour_packages/tour-packages.module';
import { HostModule } from './host/host.module';

@Module({
  imports: [
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
    KycModule,
    AuditModule,
    AdminModule,
    // Listings domain scaffolding (Week 4)
    StaysModule,
    AmenitiesModule,
    HotelPackagesModule,
    TourPackagesModule,
    HostModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Use a named wildcard to satisfy path-to-regexp v6
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
