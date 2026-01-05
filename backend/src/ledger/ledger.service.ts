import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Day 39: LedgerService - Double-Entry Accounting
 *
 * Implements double-entry bookkeeping for all financial transactions:
 * - Booking confirmations: Debit traveler, Credit provider + platform commission
 * - Refunds: Reverse original entries
 * - Payouts: Move provider earnings to payout batch
 *
 * CRITICAL: Every transaction creates paired entries (debit + credit must balance)
 */
@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);
  private readonly PLATFORM_COMMISSION_RATE = 0.15; // 15% commission

  constructor(private prisma: PrismaService) {}

  /**
   * Record booking confirmation in ledger.
   * Creates double-entry:
   * - Debit: Traveler account (payment out)
   * - Credit: Provider account (earnings)
   * - Credit: Platform account (commission)
   */
  async recordBookingConfirmation(
    bookingId: string,
    userId: string,
    providerId: string,
    totalAmount: number,
  ): Promise<void> {
    const commission = totalAmount * this.PLATFORM_COMMISSION_RATE;
    const providerEarnings = totalAmount - commission;

    this.logger.log(
      `[LEDGER] Recording booking confirmation ${bookingId}: $${totalAmount.toFixed(2)} (Provider: $${providerEarnings.toFixed(2)}, Commission: $${commission.toFixed(2)})`,
    );

    // Create paired entries (double-entry bookkeeping)
    await this.prisma.$transaction([
      // Debit: Traveler paid the total amount
      this.prisma.ledgerEntry.create({
        data: {
          bookingId,
          type: 'BOOKING_CONFIRMED',
          debitAccount: `traveler:${userId}`,
          creditAccount: 'platform:escrow',
          amount: new Decimal(totalAmount),
          currency: 'USD',
          description: `Payment for booking ${bookingId}`,
          metadata: {
            commission,
            providerEarnings,
            commissionRate: this.PLATFORM_COMMISSION_RATE,
          },
        },
      }),
      // Credit: Provider earns (total - commission)
      this.prisma.ledgerEntry.create({
        data: {
          bookingId,
          type: 'BOOKING_CONFIRMED',
          debitAccount: 'platform:escrow',
          creditAccount: `provider:${providerId}`,
          amount: new Decimal(providerEarnings),
          currency: 'USD',
          description: `Provider earnings for booking ${bookingId}`,
          metadata: {
            totalAmount,
            commission,
            commissionRate: this.PLATFORM_COMMISSION_RATE,
          },
        },
      }),
      // Credit: Platform earns commission
      this.prisma.ledgerEntry.create({
        data: {
          bookingId,
          type: 'BOOKING_CONFIRMED',
          debitAccount: 'platform:escrow',
          creditAccount: 'platform:revenue',
          amount: new Decimal(commission),
          currency: 'USD',
          description: `Platform commission for booking ${bookingId}`,
          metadata: {
            totalAmount,
            providerEarnings,
            commissionRate: this.PLATFORM_COMMISSION_RATE,
          },
        },
      }),
    ]);

    this.logger.log(`[LEDGER] ✓ Booking ${bookingId} recorded in ledger`);
  }

  /**
   * Record refund in ledger.
   * Creates reversal entries:
   * - Debit: Provider account (take back earnings)
   * - Debit: Platform account (take back commission if applicable)
   * - Credit: Traveler account (refund payment)
   */
  async recordRefund(
    bookingId: string,
    userId: string,
    providerId: string,
    refundAmount: number,
    totalAmount: number,
  ): Promise<void> {
    const refundPercentage = totalAmount > 0 ? refundAmount / totalAmount : 0;
    const commissionRefund = totalAmount * this.PLATFORM_COMMISSION_RATE * refundPercentage;
    const providerRefund = refundAmount - commissionRefund;

    this.logger.log(
      `[LEDGER] Recording refund for booking ${bookingId}: $${refundAmount.toFixed(2)} (${(refundPercentage * 100).toFixed(0)}% of $${totalAmount.toFixed(2)})`,
    );

    // Create reversal entries
    await this.prisma.$transaction([
      // Debit: Take back from provider earnings
      this.prisma.ledgerEntry.create({
        data: {
          bookingId,
          type: 'REFUND_PROCESSED',
          debitAccount: `provider:${providerId}`,
          creditAccount: 'platform:escrow',
          amount: new Decimal(providerRefund),
          currency: 'USD',
          description: `Refund deduction from provider for booking ${bookingId}`,
          metadata: {
            refundAmount,
            totalAmount,
            refundPercentage,
            commissionRefund,
          },
        },
      }),
      // Debit: Take back platform commission
      this.prisma.ledgerEntry.create({
        data: {
          bookingId,
          type: 'REFUND_PROCESSED',
          debitAccount: 'platform:revenue',
          creditAccount: 'platform:escrow',
          amount: new Decimal(commissionRefund),
          currency: 'USD',
          description: `Commission refund for booking ${bookingId}`,
          metadata: {
            refundAmount,
            totalAmount,
            refundPercentage,
            providerRefund,
          },
        },
      }),
      // Credit: Refund to traveler
      this.prisma.ledgerEntry.create({
        data: {
          bookingId,
          type: 'REFUND_PROCESSED',
          debitAccount: 'platform:escrow',
          creditAccount: `traveler:${userId}`,
          amount: new Decimal(refundAmount),
          currency: 'USD',
          description: `Refund to traveler for booking ${bookingId}`,
          metadata: {
            totalAmount,
            refundPercentage,
            providerRefund,
            commissionRefund,
          },
        },
      }),
    ]);

    this.logger.log(`[LEDGER] ✓ Refund for booking ${bookingId} recorded in ledger`);
  }

  /**
   * Get ledger entries for a booking.
   */
  async getBookingLedgerEntries(bookingId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get ledger balance for an account.
   * Calculates net balance (credits - debits).
   */
  async getAccountBalance(accountId: string): Promise<number> {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: {
        OR: [{ debitAccount: accountId }, { creditAccount: accountId }],
      },
    });

    let balance = 0;
    for (const entry of entries) {
      const amount = entry.amount.toNumber();
      if (entry.creditAccount === accountId) {
        balance += amount; // Credits increase balance
      } else if (entry.debitAccount === accountId) {
        balance -= amount; // Debits decrease balance
      }
    }

    return balance;
  }

  /**
   * Get provider earnings (available for payout).
   */
  async getProviderEarnings(providerId: string): Promise<number> {
    return this.getAccountBalance(`provider:${providerId}`);
  }

  /**
   * Get platform revenue.
   */
  async getPlatformRevenue(): Promise<number> {
    return this.getAccountBalance('platform:revenue');
  }
}
