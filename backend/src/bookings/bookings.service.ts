import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { LedgerService } from '../ledger/ledger.service';
import { CancellationService } from '../cancellation/cancellation.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';
import { CreateHoldDto } from './dto/create-hold.dto';
import { HoldResponseDto } from './dto/hold-response.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    private readonly ledgerService: LedgerService,
    private readonly cancellationService: CancellationService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Day 36: Create Quote
   * QUOTE state - customer requests a price, no inventory locked yet
   */
  async createQuote(userId: string, dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    // Idempotency check
    if (dto.idempotencyKey) {
      const existing = await this.prisma.booking.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (existing) {
        return this.mapBookingToQuoteResponse(existing);
      }
    }

    // Calculate price (server-side, never trust client)
    const priceBreakdown = await this.pricingService.calculatePrice({
      packageType: dto.packageType,
      packageId: dto.packageId,
      checkInDate: dto.checkInDate,
      checkOutDate: dto.checkOutDate,
      departureDate: dto.departureDate,
      numberOfGuests: dto.numberOfGuests,
      numberOfRooms: dto.numberOfRooms,
      selectedRoomIds: dto.selectedRoomIds,
      selectedAddOns: dto.selectedAddOns,
    });

    // Fetch package and cancellation policy
    let cancellationPolicyType: string | null = null;
    let cancellationPolicyJson: any = null;

    if (dto.packageType === 'HOTEL_PACKAGE') {
      const hotelPackage = await this.prisma.hotelPackage.findUnique({
        where: { id: dto.packageId },
        include: { cancellationPolicy: true },
      });
      if (hotelPackage?.cancellationPolicy) {
        cancellationPolicyType = hotelPackage.cancellationPolicy.type;
        cancellationPolicyJson = {
          name: hotelPackage.cancellationPolicy.name,
          description: hotelPackage.cancellationPolicy.description,
          fullRefundUntilDays: hotelPackage.cancellationPolicy.fullRefundUntilDays,
          partialRefundUntilDays: hotelPackage.cancellationPolicy.partialRefundUntilDays,
          noRefundUntilDays: hotelPackage.cancellationPolicy.noRefundUntilDays,
        };
      }
    } else if (dto.packageType === 'TOUR_PACKAGE') {
      const tourPackage = await this.prisma.tourPackage.findUnique({
        where: { id: dto.packageId },
        include: { cancellationPolicy: true },
      });
      if (tourPackage?.cancellationPolicy) {
        cancellationPolicyType = tourPackage.cancellationPolicy.type;
        cancellationPolicyJson = {
          name: tourPackage.cancellationPolicy.name,
          description: tourPackage.cancellationPolicy.description,
          fullRefundUntilDays: tourPackage.cancellationPolicy.fullRefundUntilDays,
          partialRefundUntilDays: tourPackage.cancellationPolicy.partialRefundUntilDays,
          noRefundUntilDays: tourPackage.cancellationPolicy.noRefundUntilDays,
        };
      }
    }

    // Create QUOTE booking
    const booking = await this.prisma.booking.create({
      data: {
        userId,
        hotelPackageId: dto.packageType === 'HOTEL_PACKAGE' ? dto.packageId : undefined,
        tourPackageId: dto.packageType === 'TOUR_PACKAGE' ? dto.packageId : undefined,
        status: 'QUOTE',
        checkInDate: dto.checkInDate ? new Date(dto.checkInDate) : undefined,
        checkOutDate: dto.checkOutDate ? new Date(dto.checkOutDate) : undefined,
        departureDate: dto.departureDate ? new Date(dto.departureDate) : undefined,
        numberOfGuests: dto.numberOfGuests,
        numberOfRooms: dto.numberOfRooms,
        selectedRoomIds: dto.selectedRoomIds || [],
        selectedAddOns: dto.selectedAddOns || [],
        priceSnapshot: priceBreakdown as any, // Cast to any for Json type
        totalPrice: priceBreakdown.total,
        currency: 'USD',
        cancellationPolicy: cancellationPolicyType as any,
        cancellationPolicyJson,
        idempotencyKey: dto.idempotencyKey || randomUUID(),
        quotedAt: new Date(),
      },
    });

    return this.mapBookingToQuoteResponse(booking);
  }

  private mapBookingToQuoteResponse(booking: any): QuoteResponseDto {
    const expiresAt = new Date(booking.quotedAt);
    expiresAt.setHours(expiresAt.getHours() + 24); // Quotes expire in 24 hours

    return {
      id: booking.id,
      status: 'QUOTE',
      packageType: booking.hotelPackageId ? 'HOTEL_PACKAGE' : 'TOUR_PACKAGE',
      packageId: booking.hotelPackageId || booking.tourPackageId,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      departureDate: booking.departureDate,
      numberOfGuests: booking.numberOfGuests,
      numberOfRooms: booking.numberOfRooms,
      priceSnapshot: booking.priceSnapshot,
      totalPrice: Number(booking.totalPrice),
      currency: booking.currency,
      cancellationPolicy: booking.cancellationPolicy,
      cancellationPolicyJson: booking.cancellationPolicyJson,
      quotedAt: booking.quotedAt,
      expiresAt,
    };
  }

  /**
   * Day 37: Create HOLD
   * Transitions QUOTE → HOLD with inventory locking
   * CRITICAL: Uses Postgres row-level locking for atomic inventory decrements
   */
  async createHold(userId: string, dto: CreateHoldDto): Promise<HoldResponseDto> {
    // 1. Fetch and validate quote
    const quote = await this.prisma.booking.findUnique({
      where: { id: dto.quoteId },
      include: {
        hotelPackage: true,
        tourPackage: {
          include: {
            departures: true,
          },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.userId !== userId) {
      throw new BadRequestException('You do not own this quote');
    }

    if (quote.status !== 'QUOTE') {
      throw new BadRequestException(`Cannot hold booking in ${quote.status} state`);
    }

    // Check if quote expired (24 hours)
    const quoteAge = Date.now() - quote.quotedAt.getTime();
    if (quoteAge > 24 * 60 * 60 * 1000) {
      throw new BadRequestException('Quote has expired (older than 24 hours)');
    }

    // 2. Lock inventory with Postgres transaction
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    try {
      await this.prisma.$transaction(async (tx: any) => {
        if (quote.hotelPackageId) {
          // Lock hotel inventory nights
          if (!quote.checkInDate || !quote.checkOutDate) {
            throw new BadRequestException('Hotel booking requires check-in and check-out dates');
          }

          const nights: Date[] = [];
          const current = new Date(quote.checkInDate);
          const end = new Date(quote.checkOutDate);

          while (current < end) {
            nights.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }

          // Lock each night atomically
          for (const night of nights) {
            // Convert Date to YYYY-MM-DD string for @db.Date comparison
            const nightDateStr = night.toISOString().split('T')[0];

            const result = await tx.$executeRaw`
              UPDATE "InventoryNight"
              SET "availableUnits" = "availableUnits" - ${quote.numberOfRooms || 1},
                  "lockedUntil" = ${holdExpiresAt}
              WHERE "roomId" IN (
                SELECT "id"
                FROM "Room"
                WHERE "listingId" = ${quote.hotelPackage!.listingId}
              )
              AND "date"::text = ${nightDateStr}
              AND "availableUnits" >= ${quote.numberOfRooms || 1}
            `;

            if (result === 0) {
              throw new BadRequestException(
                `Insufficient inventory for ${nightDateStr}`,
              );
            }
          }
        } else if (quote.tourPackageId) {
          // Lock tour departure seats
          if (!quote.departureDate) {
            throw new BadRequestException('Tour booking requires departure date');
          }

          const result = await tx.$executeRaw`
            UPDATE "TourDeparture"
            SET "availableSeats" = "availableSeats" - ${quote.numberOfGuests},
                "lockedUntil" = ${holdExpiresAt}
            WHERE "packageId" = ${quote.tourPackageId}
              AND "departureDate" = ${quote.departureDate}
              AND "availableSeats" >= ${quote.numberOfGuests}
          `;

          if (result === 0) {
            throw new BadRequestException('Insufficient seats available for this departure');
          }
        }

        // 3. Update booking to HOLD status
        await tx.booking.update({
          where: { id: quote.id },
          data: {
            status: 'HOLD',
            holdExpiresAt,
            heldAt: new Date(),
          },
        });
      });

      // 4. Return hold response
      const updatedBooking = await this.prisma.booking.findUnique({
        where: { id: quote.id },
      });

      return {
        id: updatedBooking!.id,
        status: 'HOLD',
        holdExpiresAt: updatedBooking!.holdExpiresAt!,
        packageType: updatedBooking!.hotelPackageId ? 'HOTEL_PACKAGE' : 'TOUR_PACKAGE',
        packageId: updatedBooking!.hotelPackageId || updatedBooking!.tourPackageId!,
        numberOfGuests: updatedBooking!.numberOfGuests,
        totalPrice: Number(updatedBooking!.totalPrice),
        currency: updatedBooking!.currency,
        priceSnapshot: updatedBooking!.priceSnapshot,
        heldAt: updatedBooking!.heldAt!,
      };
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to lock inventory: ' + error.message);
    }
  }

  /**
   * Day 39: Confirm Booking
   * PAYMENT_PENDING → CONFIRMED
   * - Capture pre-authorized payment
   * - Create double-entry ledger entries
   * - Update booking status
   */
  async confirmBooking(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        user: true,
        hotelPackage: true,
        tourPackage: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.status !== 'PAYMENT_PENDING') {
      throw new BadRequestException(
        `Cannot confirm booking with status ${booking.status}. Must be PAYMENT_PENDING.`,
      );
    }

    if (!booking.payment) {
      throw new BadRequestException('No payment found for booking');
    }

    // Get provider ID
    const providerId = booking.hotelPackage?.providerId || booking.tourPackage?.providerId;
    if (!providerId) {
      throw new BadRequestException('No provider found for booking');
    }

    const totalAmount = booking.totalPrice.toNumber();

    // Capture payment (convert PRE_AUTHORIZED → CAPTURED)
    await this.paymentsService.capturePayment(booking.payment.id);

    // Create ledger entries (double-entry accounting)
    await this.ledgerService.recordBookingConfirmation(
      bookingId,
      booking.userId,
      providerId,
      totalAmount,
    );

    // Update booking status to CONFIRMED
    const confirmedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    return {
      id: confirmedBooking.id,
      status: confirmedBooking.status,
      confirmedAt: confirmedBooking.confirmedAt,
      totalPrice: totalAmount,
      currency: confirmedBooking.currency,
    };
  }

  /**
   * Day 39: Cancel Booking (by guest)
   * CONFIRMED → CANCELLED_BY_GUEST
   * - Calculate refund using CancellationService
   * - Process refund via Stripe
   * - Create reversal ledger entries
   * - Update booking status
   */
  async cancelBookingByGuest(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        hotelPackage: true,
        tourPackage: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.userId !== userId) {
      throw new BadRequestException('You can only cancel your own bookings');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        `Cannot cancel booking with status ${booking.status}. Only CONFIRMED bookings can be cancelled.`,
      );
    }

    if (!booking.payment) {
      throw new BadRequestException('No payment found for booking');
    }

    // Get provider ID
    const providerId = booking.hotelPackage?.providerId || booking.tourPackage?.providerId;
    if (!providerId) {
      throw new BadRequestException('No provider found for booking');
    }

    const totalPaid = booking.totalPrice.toNumber();

    // Calculate refund based on cancellation policy
    const refundCalculation = await this.cancellationService.calculateRefund(bookingId);

    // Process refund via Stripe
    if (refundCalculation.isEligibleForRefund) {
      await this.paymentsService.refundPayment(
        booking.payment.id,
        refundCalculation.refundAmount,
      );
    }

    // Record refund in ledger (reversal entries)
    await this.ledgerService.recordRefund(
      bookingId,
      userId,
      providerId,
      refundCalculation.refundAmount,
      totalPaid,
    );

    // Update booking status
    const cancelledBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED_BY_GUEST',
        cancelledAt: new Date(),
      },
    });

    return {
      id: cancelledBooking.id,
      status: cancelledBooking.status,
      cancelledAt: cancelledBooking.cancelledAt,
      refundCalculation,
    };
  }

  /**
   * Day 39: Cancel Booking (by provider)
   * CONFIRMED → CANCELLED_BY_PROVIDER
   * - Full refund (100%) regardless of policy
   * - Process refund via Stripe
   * - Create reversal ledger entries
   * - Update booking status
   */
  async cancelBookingByProvider(bookingId: string, userId: string) {
    // Fetch provider profile for this user
    const providerProfile = await this.prisma.providerProfile.findFirst({
      where: { userId },
    });

    if (!providerProfile) {
      throw new BadRequestException('You must be a provider to cancel bookings');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        user: true,
        hotelPackage: true,
        tourPackage: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    const bookingProviderId =
      booking.hotelPackage?.providerId || booking.tourPackage?.providerId;
    if (bookingProviderId !== providerProfile.id) {
      throw new BadRequestException('You can only cancel your own bookings');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException(
        `Cannot cancel booking with status ${booking.status}. Only CONFIRMED bookings can be cancelled.`,
      );
    }

    if (!booking.payment) {
      throw new BadRequestException('No payment found for booking');
    }

    const totalPaid = booking.totalPrice.toNumber();

    // Provider cancellations = 100% refund (regardless of policy)
    const refundAmount = totalPaid;

    // Process full refund via Stripe
    await this.paymentsService.refundPayment(booking.payment.id, refundAmount);

    // Record refund in ledger (reversal entries)
    await this.ledgerService.recordRefund(
      bookingId,
      booking.userId,
      providerProfile.id,
      refundAmount,
      totalPaid,
    );

    // Update booking status
    const cancelledBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED_BY_PROVIDER',
        cancelledAt: new Date(),
      },
    });

    return {
      id: cancelledBooking.id,
      status: cancelledBooking.status,
      cancelledAt: cancelledBooking.cancelledAt,
      refundAmount,
      totalPaid,
    };
  }
}


