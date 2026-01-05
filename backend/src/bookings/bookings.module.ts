import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { HoldExpirationService } from './hold-expiration.service';
import { PrismaService } from '../prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { LedgerService } from '../ledger/ledger.service';
import { CancellationService } from '../cancellation/cancellation.service';
import { PaymentsService } from '../payments/payments.service';

@Module({
  controllers: [BookingsController],
  providers: [
    BookingsService,
    HoldExpirationService,
    PrismaService,
    PricingService,
    LedgerService,
    CancellationService,
    PaymentsService,
  ],
  exports: [BookingsService],
})
export class BookingsModule {}

