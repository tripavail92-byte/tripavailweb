import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { Prisma } from '@prisma/client';

/**
 * Day 38: PaymentsService - Real Stripe Integration
 *
 * Handles payment pre-authorization for bookings in HOLD state.
 * Uses Stripe Payment Intents API for pre-authorization and capture flow.
 *
 * Flow:
 * 1. Validate booking is in HOLD state and not expired
 * 2. Pre-authorize payment with Stripe (creates Payment Intent)
 * 3. Create Payment record with PRE_AUTHORIZED status
 * 4. Update booking status: HOLD → PAYMENT_PENDING
 * 5. Return payment confirmation
 *
 * Critical: Payment amount MUST match booking.totalPrice (server-calculated).
 */
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

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
  }

  /**
   * Pre-authorize payment for a booking in HOLD state.
   * Transitions booking: HOLD → PAYMENT_PENDING.
   */
  async preAuthorizePayment(userId: string, dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    this.logger.log(`[PAYMENT] Pre-authorizing payment for booking ${dto.bookingId}`);

    // 1. Validate booking
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: {
        payment: true, // Check if payment already exists
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${dto.bookingId} not found`);
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('You can only pay for your own bookings');
    }

    if (booking.status !== 'HOLD') {
      throw new BadRequestException(`Booking must be in HOLD state (current: ${booking.status})`);
    }

    if (booking.holdExpiresAt && booking.holdExpiresAt < new Date()) {
      throw new BadRequestException('Booking hold has expired');
    }

    if (booking.payment) {
      throw new BadRequestException('Payment already exists for this booking');
    }

    // 2. Create Stripe Payment Intent for pre-authorization
    const paymentIntent = await this.createStripePaymentIntent(
      booking.totalPrice.toNumber(),
      dto.paymentMethodId,
      booking.id,
      userId,
    );

    // 3. Create Payment record and update booking status atomically
    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          status: 'PRE_AUTHORIZED',
          amount: booking.totalPrice,
          currency: 'USD',
          paymentMethodId: dto.paymentMethodId,
          paymentIntentId: paymentIntent.id,
          metadata: {
            idempotencyKey: dto.idempotencyKey,
            preAuthorizedAt: new Date().toISOString(),
          },
        },
      });

      // Update booking status: HOLD → PAYMENT_PENDING
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'PAYMENT_PENDING',
          updatedAt: new Date(),
        },
      });

      return { payment, booking: updatedBooking };
    });

    this.logger.log(
      `[PAYMENT] Pre-authorized $${result.payment.amount} for booking ${booking.id} (Intent: ${paymentIntent.id})`,
    );

    return {
      id: result.payment.id,
      bookingId: result.payment.bookingId,
      status: result.payment.status,
      amount: result.payment.amount.toNumber(),
      currency: result.payment.currency,
      paymentIntentId: result.payment.paymentIntentId!,
      bookingStatus: result.booking.status,
      createdAt: result.payment.createdAt,
    };
  }

  /**
   * Create Stripe Payment Intent for pre-authorization.
   * capture_method: 'manual' = pre-authorize only, capture later on confirmation
   */
  private async createStripePaymentIntent(
    amount: number,
    paymentMethodId: string,
    bookingId: string,
    userId: string,
  ): Promise<Stripe.PaymentIntent> {
    this.logger.debug(`[STRIPE] Creating Payment Intent for $${amount} (booking: ${bookingId})`);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert dollars to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        capture_method: 'manual', // Pre-authorize only, capture later
        confirm: true, // Confirm immediately with provided payment method
        metadata: {
          bookingId,
          userId,
          createdAt: new Date().toISOString(),
        },
      });

      this.logger.log(
        `[STRIPE] Created Payment Intent: ${paymentIntent.id} (status: ${paymentIntent.status})`,
      );

      return paymentIntent;
    } catch (error: any) {
      this.logger.error(`[STRIPE] Payment Intent creation failed: ${error.message}`);
      throw new BadRequestException(`Payment failed: ${error.message}`);
    }
  }

  /**
   * Capture a pre-authorized payment (Day 39 - CONFIRMED state).
   * Called after booking confirmation to actually charge the customer.
   */
  async capturePayment(paymentId: string): Promise<void> {
    this.logger.log(`[PAYMENT] Capturing payment ${paymentId}`);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status !== 'PRE_AUTHORIZED') {
      throw new BadRequestException(`Payment must be PRE_AUTHORIZED to capture (current: ${payment.status})`);
    }

    // Capture payment via Stripe
    await this.captureStripePaymentIntent(payment.paymentIntentId!);

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'CAPTURED',
        updatedAt: new Date(),
      },
    });

    this.logger.log(`[PAYMENT] Successfully captured payment ${paymentId}`);
  }

  /**
   * Capture a Stripe Payment Intent (finalize the charge).
   */
  private async captureStripePaymentIntent(paymentIntentId: string): Promise<void> {
    this.logger.debug(`[STRIPE] Capturing Payment Intent: ${paymentIntentId}`);

    try {
      const paymentIntent = await this.stripe.paymentIntents.capture(paymentIntentId);
      this.logger.log(`[STRIPE] Payment Intent ${paymentIntentId} captured (status: ${paymentIntent.status})`);
    } catch (error: any) {
      this.logger.error(`[STRIPE] Capture failed: ${error.message}`);
      throw new BadRequestException(`Payment capture failed: ${error.message}`);
    }
  }

  /**
   * Refund a captured payment (Day 39 - Cancellation flows).
   * Called when a booking is cancelled to return money to the customer.
   */
  async refundPayment(paymentId: string, refundAmount: number): Promise<void> {
    this.logger.log(`[PAYMENT] Refunding $${refundAmount.toFixed(2)} for payment ${paymentId}`);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status !== 'CAPTURED') {
      throw new BadRequestException(
        `Payment must be CAPTURED to refund (current: ${payment.status})`,
      );
    }

    const totalPaid = payment.amount.toNumber();
    if (refundAmount > totalPaid) {
      throw new BadRequestException(
        `Refund amount ($${refundAmount}) cannot exceed payment amount ($${totalPaid})`,
      );
    }

    // Create Stripe refund
    await this.createStripeRefund(payment.paymentIntentId!, refundAmount);

    // Update payment status
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: refundAmount === totalPaid ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        metadata: {
          ...((payment.metadata as any) || {}),
          refundedAmount: refundAmount,
          refundedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    });

    this.logger.log(`[PAYMENT] Successfully refunded $${refundAmount.toFixed(2)} for payment ${paymentId}`);
  }

  /**
   * Create a Stripe refund.
   */
  private async createStripeRefund(paymentIntentId: string, amount: number): Promise<void> {
    this.logger.debug(`[STRIPE] Creating refund for Payment Intent ${paymentIntentId}: $${amount.toFixed(2)}`);

    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(amount * 100), // Convert dollars to cents
      });

      this.logger.log(`[STRIPE] Created refund: ${refund.id} (status: ${refund.status})`);
    } catch (error: any) {
      this.logger.error(`[STRIPE] Refund creation failed: ${error.message}`);
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }
}


