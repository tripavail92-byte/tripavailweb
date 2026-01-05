import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeConnectService } from './stripe-connect.service';
import { StripeWebhookService } from './stripe-webhook.service';
import { StripeWebhookController } from './stripe-webhook.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [
    PaymentsService,
    StripeConnectService,
    StripeWebhookService,
    PrismaService,
  ],
  controllers: [PaymentsController, StripeWebhookController],
  exports: [PaymentsService, StripeConnectService],
})
export class PaymentsModule {}
