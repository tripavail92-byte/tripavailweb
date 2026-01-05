import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

/**
 * Day 37: HoldExpirationService
 *
 * Automatically releases expired booking holds to restore inventory.
 * Runs every minute to check for holds where holdExpiresAt < now.
 *
 * Responsibilities:
 * 1. Find all bookings with status=HOLD and holdExpiresAt < now
 * 2. For each expired hold, atomically:
 *    - Release inventory locks (set lockedUntil=null, restore availableUnits/Seats)
 *    - Update booking status: HOLD → EXPIRED_HOLD
 * 3. Log all operations for audit trail
 *
 * Critical: Uses Postgres transactions to prevent race conditions.
 */
@Injectable()
export class HoldExpirationService {
  private readonly logger = new Logger(HoldExpirationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Runs every minute to release expired holds.
   * Uses @Cron from @nestjs/schedule.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredHolds(): Promise<void> {
    try {
      const now = new Date();
      this.logger.debug(`[HOLD-EXPIRATION] Starting expired hold check at ${now.toISOString()}`);

      // Find all expired holds (holdExpiresAt < now AND status = HOLD)
      const expiredHolds = await this.prisma.booking.findMany({
        where: {
          status: 'HOLD',
          holdExpiresAt: {
            lt: now,
          },
        },
        include: {
          hotelPackage: true,
          tourPackage: true,
        },
      });

      if (expiredHolds.length === 0) {
        this.logger.debug('[HOLD-EXPIRATION] No expired holds found');
        return;
      }

      this.logger.log(`[HOLD-EXPIRATION] Found ${expiredHolds.length} expired holds to release`);

      // Process each expired hold in a transaction
      for (const booking of expiredHolds) {
        try {
          await this.releaseHold(booking);
          this.logger.log(`[HOLD-EXPIRATION] Released hold for booking ${booking.id}`);
        } catch (error: unknown) {
          const errMessage = error instanceof Error ? error.message : 'Unknown error';
          const errStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `[HOLD-EXPIRATION] Failed to release hold for booking ${booking.id}: ${errMessage}`,
            errStack,
          );
          // Continue processing other holds even if one fails
        }
      }

      this.logger.log(`[HOLD-EXPIRATION] Completed expired hold cleanup`);
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      const errStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`[HOLD-EXPIRATION] Fatal error in releaseExpiredHolds: ${errMessage}`, errStack);
    }
  }

  /**
   * Release a single expired hold atomically.
   * Restores inventory and updates booking status.
   */
  private async releaseHold(booking: any): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (booking.hotelPackage) {
        // Release hotel room inventory
        await this.releaseHotelInventory(tx, booking);
      } else if (booking.tourPackage) {
        // Release tour seat inventory
        await this.releaseTourInventory(tx, booking);
      }

      // Update booking status: HOLD → EXPIRED_HOLD
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'EXPIRED_HOLD',
          updatedAt: new Date(),
        },
      });
    });
  }

  /**
   * Release locked hotel room inventory atomically.
   * Clears lockedUntil for all nights in the hold.
   */
  private async releaseHotelInventory(tx: Prisma.TransactionClient, booking: any): Promise<void> {
    const { checkIn, checkOut } = booking;

    // Generate night dates
    const nights = this.generateNightDates(new Date(checkIn), new Date(checkOut));

    for (const night of nights) {
      // Use raw SQL to atomically restore inventory
      // Clear lockedUntil where it matches the booking's holdExpiresAt
      await tx.$executeRaw`
        UPDATE "InventoryNight"
        SET "lockedUntil" = NULL,
            "updatedAt" = NOW()
        WHERE "listingId" = ${booking.hotelPackage.listingId}
          AND "date" = ${night}::date
          AND "lockedUntil" = ${booking.holdExpiresAt}
      `;
    }

    this.logger.debug(
      `[HOLD-EXPIRATION] Released ${nights.length} nights for hotel package ${booking.hotelPackageId}`,
    );
  }

  /**
   * Release locked tour seat inventory atomically.
   * Clears lockedUntil for the departure.
   */
  private async releaseTourInventory(tx: Prisma.TransactionClient, booking: any): Promise<void> {
    const { checkIn: departureDate, guestDetails } = booking;
    const seatsRequested = guestDetails?.adults + (guestDetails?.children || 0);

    // Use raw SQL to atomically restore inventory
    // Clear lockedUntil where it matches the booking's holdExpiresAt
    await tx.$executeRaw`
      UPDATE "TourDeparture"
      SET "lockedUntil" = NULL,
          "updatedAt" = NOW()
      WHERE "tourPackageId" = ${booking.tourPackageId}
        AND "departureDate" = ${departureDate}::date
        AND "lockedUntil" = ${booking.holdExpiresAt}
    `;

    this.logger.debug(
      `[HOLD-EXPIRATION] Released ${seatsRequested} seats for tour package ${booking.tourPackageId}`,
    );
  }

  /**
   * Generate array of night dates between check-in and check-out.
   * Example: checkIn=2025-01-01, checkOut=2025-01-03 → [2025-01-01, 2025-01-02]
   */
  private generateNightDates(checkIn: Date, checkOut: Date): Date[] {
    const nights: Date[] = [];
    const current = new Date(checkIn);
    const end = new Date(checkOut);

    while (current < end) {
      nights.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return nights;
  }
}
