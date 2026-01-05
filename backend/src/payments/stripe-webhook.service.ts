import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma.service';
import { PayoutStatus } from '@prisma/client';

/**
 * Stripe Webhook Service
 * Processes Stripe webhook events for payments, transfers, disputes
 * 
 * Key Events:
 * - transfer.created: Transfer initiated
 * - transfer.updated: Transfer status changed
 * - transfer.paid: Transfer completed (funds sent to provider's bank)
 * - transfer.failed: Transfer failed
 * - transfer.reversed: Transfer reversed (refund)
 * - payout.created: Payout to provider's bank initiated
 * - payout.paid: Payout completed
 * - payout.failed: Payout failed
 * - charge.dispute.created: Customer disputed a charge
 * - charge.dispute.closed: Dispute resolved
 */
@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });

    this.webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    if (!this.webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not configured - webhook signature verification disabled');
    }
  }

  /**
   * Verify webhook signature and process event
   */
  async verifyAndProcessWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    let event: Stripe.Event;

    if (this.webhookSecret) {
      try {
        event = this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          this.webhookSecret,
        );
      } catch (error: any) {
        this.logger.error(`Webhook signature verification failed: ${error.message}`);
        throw new Error(`Webhook signature verification failed: ${error.message}`);
      }
    } else {
      // Development mode: skip signature verification
      event = JSON.parse(rawBody.toString());
      this.logger.warn('Webhook signature verification skipped (no secret configured)');
    }

    // Process event based on type
    await this.processEvent(event);

    return event;
  }

  /**
   * Process Stripe event based on type
   */
  private async processEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing event: ${event.type}`);

    switch (event.type) {
      // Transfer events (platform → provider Stripe account)
      case 'transfer.created':
        await this.handleTransferCreated(event.data.object as Stripe.Transfer);
        break;
      case 'transfer.updated':
        await this.handleTransferUpdated(event.data.object as Stripe.Transfer);
        break;
      // Note: transfer.paid and transfer.failed are not standard Stripe events
      // Use transfer.updated to check status instead
      case 'transfer.reversed':
        await this.handleTransferReversed(event.data.object as Stripe.Transfer);
        break;

      // Payout events (Stripe account → provider's bank)
      case 'payout.created':
        await this.handlePayoutCreated(event.data.object as Stripe.Payout);
        break;
      case 'payout.paid':
        await this.handlePayoutPaid(event.data.object as Stripe.Payout);
        break;
      case 'payout.failed':
        await this.handlePayoutFailed(event.data.object as Stripe.Payout);
        break;

      // Dispute events
      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      case 'charge.dispute.updated':
        await this.handleDisputeUpdated(event.data.object as Stripe.Dispute);
        break;
      case 'charge.dispute.closed':
        await this.handleDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle transfer.created event
   */
  private async handleTransferCreated(transfer: Stripe.Transfer): Promise<void> {
    this.logger.log(`Transfer created: ${transfer.id}`);

    // Update payout statement with transfer ID
    await this.prisma.payoutStatement.updateMany({
      where: {
        transferId: null,
        status: PayoutStatus.IN_PROGRESS,
      },
      data: {
        transferId: transfer.id,
      },
    });
  }

  /**
   * Handle transfer.updated event
   * Check if transfer succeeded or failed based on status
   */
  private async handleTransferUpdated(transfer: Stripe.Transfer): Promise<void> {
    this.logger.log(`Transfer updated: ${transfer.id}`);
    
    // Transfers don't have a status field in newer Stripe API versions
    // They are either created successfully or fail immediately
    // Check if transfer was reversed instead
    if (transfer.reversed) {
      this.logger.warn(`Transfer ${transfer.id} was reversed`);
      await this.prisma.payoutStatement.updateMany({
        where: { transferId: transfer.id },
        data: {
          status: PayoutStatus.CANCELLED,
          failureReason: 'Transfer reversed',
        },
      });
    }
  }

  /**
   * Handle transfer.reversed event (refund)
   */
  private async handleTransferReversed(transfer: Stripe.Transfer): Promise<void> {
    this.logger.warn(`Transfer reversed: ${transfer.id}`);

    // Update payout statement status
    const updated = await this.prisma.payoutStatement.updateMany({
      where: { transferId: transfer.id },
      data: {
        status: PayoutStatus.CANCELLED,
        failureReason: 'Transfer reversed',
      },
    });

    if (updated.count > 0) {
      this.logger.log(`Updated ${updated.count} payout statement(s) to CANCELLED`);
    }
  }

  /**
   * Handle payout.created event
   */
  private async handlePayoutCreated(payout: Stripe.Payout): Promise<void> {
    this.logger.log(`Payout created: ${payout.id}, amount: $${(payout.amount / 100).toFixed(2)}`);
  }

  /**
   * Handle payout.paid event (funds sent to provider's bank)
   */
  private async handlePayoutPaid(payout: Stripe.Payout): Promise<void> {
    this.logger.log(`Payout paid: ${payout.id}, amount: $${(payout.amount / 100).toFixed(2)}`);
  }

  /**
   * Handle payout.failed event
   */
  private async handlePayoutFailed(payout: Stripe.Payout): Promise<void> {
    this.logger.error(
      `Payout failed: ${payout.id}, reason: ${payout.failure_message || 'unknown'}`,
    );
  }

  /**
   * Handle charge.dispute.created event (chargeback)
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    this.logger.warn(
      `Dispute created: ${dispute.id}, charge: ${dispute.charge}, amount: $${(dispute.amount / 100).toFixed(2)}`,
    );

    // TODO: Create dispute record in database
    // TODO: Notify admin of dispute
    // TODO: Hold provider payout if applicable
  }

  /**
   * Handle charge.dispute.updated event
   */
  private async handleDisputeUpdated(dispute: Stripe.Dispute): Promise<void> {
    this.logger.log(`Dispute updated: ${dispute.id}, status: ${dispute.status}`);
  }

  /**
   * Handle charge.dispute.closed event
   */
  private async handleDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
    this.logger.log(
      `Dispute closed: ${dispute.id}, status: ${dispute.status}, outcome: ${dispute.status}`,
    );

    // If dispute won, no action needed
    // If dispute lost, refund was already processed
  }
}
