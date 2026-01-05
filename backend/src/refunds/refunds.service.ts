import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Refund, RefundStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  calculateRefund,
  extractCancellationPolicy,
  extractPriceBreakdown,
} from './refund-calculator';

export interface CreateRefundRequest {
  bookingId: string;
  userId: string;
  cancellationReason?: string;
}

export interface ApproveRefundRequest {
  refundId: string;
  adminId: string;
  notes?: string;
}

export interface ProcessRefundRequest {
  refundId: string;
  refundPaymentId?: string; // Stripe refund ID, etc.
}

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Request a refund for a booking
   * Creates refund in PENDING state with calculated amount
   */
  async requestRefund(req: CreateRefundRequest): Promise<Refund> {
    const { bookingId, userId, cancellationReason } = req;

    // Fetch booking with all required details
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, hotelPackage: true, tourPackage: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking not found: ${bookingId}`);
    }

    // Verify the requester is the booking owner or admin
    if (booking.userId !== userId) {
      throw new BadRequestException(
        'Only the booking owner can request a refund',
      );
    }

    // Verify booking is in a refundable state
    const refundableStates = ['CONFIRMED', 'PAYMENT_PENDING'];
    if (!refundableStates.includes(booking.status)) {
      throw new BadRequestException(
        `Booking status ${booking.status} is not refundable`,
      );
    }

    // Check if refund already exists
    const existingRefund = await this.prisma.refund.findUnique({
      where: { bookingId },
    });
    if (existingRefund) {
      throw new BadRequestException('Refund already requested for this booking');
    }

    // Determine the provider (hotel or tour package provider)
    let providerId: string | undefined;
    if (booking.hotelPackageId) {
      const pkg = await this.prisma.hotelPackage.findUnique({
        where: { id: booking.hotelPackageId },
      });
      providerId = pkg?.providerId;
    } else if (booking.tourPackageId) {
      const pkg = await this.prisma.tourPackage.findUnique({
        where: { id: booking.tourPackageId },
      });
      providerId = pkg?.providerId;
    }

    if (!providerId) {
      throw new BadRequestException('Could not determine provider for booking');
    }

    // Extract cancellation policy from booking snapshot
    const policy =
      extractCancellationPolicy(booking.cancellationPolicyJson) ||
      booking.cancellationPolicy;

    if (!policy) {
      throw new BadRequestException('No cancellation policy found for booking');
    }

    // Extract price breakdown
    const priceBreakdown = extractPriceBreakdown(booking.priceSnapshot);

    // Calculate refund based on policy and timing
    const checkInDate = booking.checkInDate || booking.departureDate;
    if (!checkInDate) {
      throw new BadRequestException('Booking has no check-in or departure date');
    }

    const refundCalc = calculateRefund({
      totalBookingPrice: priceBreakdown.basePrice,
      platformFeeAmount: priceBreakdown.commission,
      cancellationPolicy: policy,
      checkInDate,
      cancellationRequestedAt: new Date(),
      cancellationReason,
    });

    // Create refund record in PENDING state
    const refund = await this.prisma.refund.create({
      data: {
        bookingId,
        userId,
        providerId,
        status: RefundStatus.PENDING,
        reason: cancellationReason || 'Customer Request',
        refundAmount: refundCalc.refundAmount,
        refundReason: refundCalc.reason,
        cancellationPolicyApplied: policy,
        refundPercentage: new Decimal(refundCalc.refundPercentage),
        refundJson: JSON.parse(JSON.stringify({
          calculation: {
            refundPercentage: refundCalc.refundPercentage,
            refundAmount: refundCalc.refundAmount.toString(),
            platformFeeDeducted: refundCalc.platformFeeDeducted.toString(),
            netRefundAmount: refundCalc.netRefundAmount.toString(),
            reason: refundCalc.reason,
            policyApplied: refundCalc.policyApplied,
            daysUntilCheckIn: refundCalc.daysUntilCheckIn,
          },
          priceBreakdown: {
            basePrice: priceBreakdown.basePrice.toString(),
            tax: priceBreakdown.tax.toString(),
            commission: priceBreakdown.commission.toString(),
            total: priceBreakdown.total.toString(),
          },
          bookingDetails: {
            originalPrice: priceBreakdown.basePrice.toString(),
            commission: priceBreakdown.commission.toString(),
            checkInDate: checkInDate.toISOString(),
            cancellationDate: new Date().toISOString(),
          },
        })),
      },
    });

    this.logger.log(
      `Refund requested for booking ${bookingId}: $${refundCalc.refundAmount} (${refundCalc.refundPercentage}%)`,
    );

    return refund;
  }

  /**
   * Approve a refund (admin action)
   * Moves refund from PENDING to APPROVED
   */
  async approveRefund(req: ApproveRefundRequest): Promise<Refund> {
    const { refundId, adminId, notes } = req;

    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException(`Refund not found: ${refundId}`);
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException(
        `Refund is in ${refund.status} state, cannot approve`,
      );
    }

    const updated = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.APPROVED,
        approvedBy: adminId,
        approvedAt: new Date(),
        adminNotes: notes,
      },
    });

    this.logger.log(`Refund ${refundId} approved by ${adminId}`);

    return updated;
  }

  /**
   * Reject a refund (admin action)
   * Moves refund from PENDING to REJECTED
   */
  async rejectRefund(
    refundId: string,
    adminId: string,
    reason: string,
  ): Promise<Refund> {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException(`Refund not found: ${refundId}`);
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new BadRequestException(
        `Refund is in ${refund.status} state, cannot reject`,
      );
    }

    const updated = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.REJECTED,
        approvedBy: adminId,
        approvedAt: new Date(),
        adminNotes: `Rejected: ${reason}`,
      },
    });

    this.logger.log(`Refund ${refundId} rejected by ${adminId}: ${reason}`);

    return updated;
  }

  /**
   * Process an approved refund (payment gateway)
   * Moves refund from APPROVED to PROCESSED
   * Creates ledger entries for double-entry accounting
   */
  async processRefund(req: ProcessRefundRequest): Promise<Refund> {
    const { refundId, refundPaymentId } = req;

    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
      include: { booking: true },
    });

    if (!refund) {
      throw new NotFoundException(`Refund not found: ${refundId}`);
    }

    if (refund.status !== RefundStatus.APPROVED) {
      throw new BadRequestException(
        `Refund is in ${refund.status} state, only APPROVED refunds can be processed`,
      );
    }

    // Update refund status
    const updated = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.PROCESSED,
        refundPaymentId,
        processedAt: new Date(),
      },
    });

    // Create ledger entries for the refund (double-entry)
    // Debit: Traveler's account (refund owed to them)
    // Credit: Provider's earnings (amount deducted from their balance)
    await this.prisma.ledgerEntry.create({
      data: {
        bookingId: refund.bookingId,
        type: 'REFUND_PROCESSED',
        debitAccount: `traveler:${refund.userId}`,
        creditAccount: `provider:${refund.providerId}`,
        amount: refund.refundAmount,
        currency: 'USD',
        description: `Refund processed for booking ${refund.bookingId}`,
        metadata: {
          refundId,
          refundReason: refund.refundReason,
          refundPercentage: refund.refundPercentage?.toString() || '0',
        },
      },
    });

    this.logger.log(
      `Refund ${refundId} processed: $${refund.refundAmount} to traveler`,
    );

    return updated;
  }

  /**
   * Mark a refund as failed (payment issue)
   * Moves refund back to APPROVED or PENDING for retry
   */
  async failRefund(
    refundId: string,
    reason: string,
  ): Promise<Refund> {
    const refund = await this.prisma.refund.findUnique({
      where: { id: refundId },
    });

    if (!refund) {
      throw new NotFoundException(`Refund not found: ${refundId}`);
    }

    if (refund.status !== RefundStatus.PROCESSED) {
      throw new BadRequestException(
        `Only PROCESSED refunds can be marked as failed`,
      );
    }

    const updated = await this.prisma.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.FAILED,
        failureReason: reason,
      },
    });

    this.logger.error(`Refund ${refundId} failed: ${reason}`);

    return updated;
  }

  /**
   * Get refund by ID
   */
  async getRefund(refundId: string): Promise<Refund | null> {
    return this.prisma.refund.findUnique({
      where: { id: refundId },
    });
  }

  /**
   * Get refund by booking ID
   */
  async getRefundByBooking(bookingId: string): Promise<Refund | null> {
    return this.prisma.refund.findUnique({
      where: { bookingId },
    });
  }

  /**
   * Get all refunds for a user
   */
  async getUserRefunds(userId: string): Promise<Refund[]> {
    return this.prisma.refund.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get all refunds for a provider
   */
  async getProviderRefunds(providerId: string): Promise<Refund[]> {
    return this.prisma.refund.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get refunds by status
   */
  async getRefundsByStatus(status: RefundStatus): Promise<Refund[]> {
    return this.prisma.refund.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get refunds needing approval (admin dashboard)
   */
  async getPendingRefunds(): Promise<Refund[]> {
    return this.prisma.refund.findMany({
      where: { status: RefundStatus.PENDING },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Calculate statistics for refunds
   */
  async getRefundStatistics(): Promise<{
    totalRefunds: number;
    totalRefundedAmount: Decimal;
    byStatus: Record<string, number>;
    byPolicy: Record<string, { count: number; totalAmount: Decimal }>;
  }> {
    const refunds = await this.prisma.refund.findMany({});

    const stats = {
      totalRefunds: refunds.length,
      totalRefundedAmount: new Decimal(0),
      byStatus: {} as Record<string, number>,
      byPolicy: {} as Record<
        string,
        { count: number; totalAmount: Decimal }
      >,
    };

    for (const refund of refunds) {
      // Total refunded amount
      if (
        refund.status === RefundStatus.PROCESSED ||
        refund.status === RefundStatus.APPROVED
      ) {
        stats.totalRefundedAmount = stats.totalRefundedAmount.plus(
          refund.refundAmount,
        );
      }

      // By status
      stats.byStatus[refund.status] = (stats.byStatus[refund.status] || 0) + 1;

      // By policy
      const policy = refund.cancellationPolicyApplied || 'UNKNOWN';
      if (!stats.byPolicy[policy]) {
        stats.byPolicy[policy] = {
          count: 0,
          totalAmount: new Decimal(0),
        };
      }
      stats.byPolicy[policy].count++;
      stats.byPolicy[policy].totalAmount = stats.byPolicy[policy].totalAmount.plus(
        refund.refundAmount,
      );
    }

    return stats;
  }
}
