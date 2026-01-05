import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CancellationPolicyType } from '@prisma/client';

/**
 * Day 38B: CancellationPolicyService
 *
 * Calculates refund amounts based on cancellation policies and timing.
 * Used when transitioning bookings from CONFIRMED → CANCELLED.
 *
 * Policy Structure (from seed data):
 * - FLEXIBLE: Full refund until 24h before check-in
 * - MODERATE: Full refund until 7 days, 50% until 24h before
 * - STRICT: Full refund until 30 days, 50% until 7 days before
 * - NON_REFUNDABLE: No refunds under any circumstances
 */
@Injectable()
export class CancellationService {
  private readonly logger = new Logger(CancellationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate refund amount for a booking cancellation.
   *
   * @param bookingId - Booking ID to cancel
   * @param cancellationDate - When cancellation is requested (defaults to now)
   * @returns Refund calculation breakdown
   */
  async calculateRefund(
    bookingId: string,
    cancellationDate: Date = new Date(),
  ): Promise<RefundCalculation> {
    // Fetch booking with policy details
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        hotelPackage: {
          include: {
            cancellationPolicy: true,
          },
        },
        tourPackage: {
          include: {
            cancellationPolicy: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    if (!booking.payment) {
      throw new Error(`No payment found for booking ${bookingId}`);
    }

    // Get cancellation policy
    const policy =
      booking.hotelPackage?.cancellationPolicy || booking.tourPackage?.cancellationPolicy;

    if (!policy) {
      throw new Error(`No cancellation policy found for booking ${bookingId}`);
    }

    // Calculate days until check-in (use checkInDate for hotels, departureDate for tours)
    const checkInDate = booking.checkInDate || booking.departureDate;
    if (!checkInDate) {
      throw new Error(`No check-in or departure date found for booking ${bookingId}`);
    }

    const daysUntilCheckIn = Math.floor(
      (checkInDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Get original payment amount
    const totalPaid = booking.payment.amount.toNumber();

    // Calculate refund based on policy
    const refundAmount = this.calculateRefundAmount(policy.type, daysUntilCheckIn, totalPaid);

    // Calculate fees
    const platformFee = totalPaid - refundAmount;

    const result: RefundCalculation = {
      bookingId: booking.id,
      policyType: policy.type,
      policyName: policy.name,
      totalPaid,
      refundAmount,
      platformFee,
      refundPercentage: totalPaid > 0 ? (refundAmount / totalPaid) * 100 : 0,
      daysUntilCheckIn,
      cancellationDate,
      checkInDate,
      isEligibleForRefund: refundAmount > 0,
    };

    this.logger.log(
      `[REFUND-CALC] Booking ${bookingId}: ${policy.type} policy, ${daysUntilCheckIn}d until check-in → ${result.refundPercentage.toFixed(0)}% refund ($${refundAmount.toFixed(2)})`,
    );

    return result;
  }

  /**
   * Core refund calculation logic based on policy type and timing.
   */
  private calculateRefundAmount(
    policyType: CancellationPolicyType,
    daysUntilCheckIn: number,
    totalPaid: number,
  ): number {
    switch (policyType) {
      case 'FLEXIBLE':
        // Full refund if cancelled 24+ hours before check-in
        return daysUntilCheckIn >= 1 ? totalPaid : 0;

      case 'MODERATE':
        // Full refund if cancelled 7+ days before
        if (daysUntilCheckIn >= 7) return totalPaid;
        // 50% refund if cancelled 1-6 days before
        if (daysUntilCheckIn >= 1) return totalPaid * 0.5;
        // No refund if cancelled within 24 hours
        return 0;

      case 'STRICT':
        // Full refund if cancelled 30+ days before
        if (daysUntilCheckIn >= 30) return totalPaid;
        // 50% refund if cancelled 7-29 days before
        if (daysUntilCheckIn >= 7) return totalPaid * 0.5;
        // No refund if cancelled within 7 days
        return 0;

      case 'NON_REFUNDABLE':
        // Never refundable
        return 0;

      default:
        this.logger.warn(`Unknown cancellation policy type: ${policyType}`);
        return 0;
    }
  }

  /**
   * Get cancellation policy by type.
   * Useful for displaying policy terms to users before booking.
   */
  async getPolicyByType(type: CancellationPolicyType) {
    return this.prisma.cancellationPolicy.findUnique({
      where: { type },
    });
  }

  /**
   * List all available cancellation policies.
   */
  async getAllPolicies() {
    return this.prisma.cancellationPolicy.findMany({
      orderBy: { type: 'asc' },
    });
  }
}

/**
 * Refund calculation result.
 */
export interface RefundCalculation {
  bookingId: string;
  policyType: CancellationPolicyType;
  policyName: string;
  totalPaid: number;
  refundAmount: number;
  platformFee: number;
  refundPercentage: number;
  daysUntilCheckIn: number;
  cancellationDate: Date;
  checkInDate: Date;
  isEligibleForRefund: boolean;
}

