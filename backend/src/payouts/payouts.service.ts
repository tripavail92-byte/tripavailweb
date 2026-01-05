import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  PayoutBatch,
  PayoutStatement,
  PayoutStatus,
  PayoutScheduleFrequency,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface ProviderEarnings {
  providerId: string;
  totalEarnings: Decimal;
  platformFees: Decimal;
  refundsDeducted: Decimal;
  netAmount: Decimal;
  bookingCount: number;
  period: { startDate: Date; endDate: Date };
}

export interface CreatePayoutBatchRequest {
  frequency: PayoutScheduleFrequency;
  startDate: Date;
  endDate: Date;
  notes?: string;
}

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate provider earnings from ledger entries
   * Aggregates all credits to provider accounts in the time period
   */
  async calculateProviderEarnings(
    providerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ProviderEarnings> {
    // Get all ledger entries where provider received credit (earnings)
    const earningsEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        creditAccount: `provider:${providerId}`,
        type: { in: ['BOOKING_CHARGE', 'BOOKING_CONFIRMED'] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get all refund deductions
    const refundEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        debitAccount: `provider:${providerId}`,
        type: { in: ['REFUND', 'REFUND_PROCESSED'] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Calculate totals
    const totalEarnings = earningsEntries.reduce(
      (sum: Decimal, entry: any) => sum.plus(entry.amount),
      new Decimal(0),
    );

    const refundsDeducted = refundEntries.reduce(
      (sum: Decimal, entry: any) => sum.plus(entry.amount),
      new Decimal(0),
    );

    // Platform fee is 10% of gross earnings (configurable)
    const platformFeeRate = new Decimal(0.1); // 10%
    const platformFees = totalEarnings.mul(platformFeeRate);

    // Net amount = earnings - fees - refunds
    const netAmount = totalEarnings.minus(platformFees).minus(refundsDeducted);

    return {
      providerId,
      totalEarnings,
      platformFees,
      refundsDeducted,
      netAmount,
      bookingCount: earningsEntries.length,
      period: { startDate, endDate },
    };
  }

  /**
   * Get all providers who have earnings in the time period
   */
  async getProvidersWithEarnings(startDate: Date, endDate: Date): Promise<string[]> {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: {
        type: 'BOOKING_CONFIRMED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        creditAccount: true,
      },
      distinct: ['creditAccount'],
    });

    // Extract provider IDs from "provider:xxx" format
    return entries
      .map((e: any) => e.creditAccount)
      .filter((account: string) => account.startsWith('provider:'))
      .map((account: string) => account.replace('provider:', ''));
  }

  /**
   * Create a payout batch for a time period
   * Calculates earnings for all providers and creates payout statements
   */
  async createPayoutBatch(req: CreatePayoutBatchRequest): Promise<PayoutBatch> {
    const { frequency, startDate, endDate, notes } = req;

    // Generate batch number (e.g., PAYOUT-2026-01-001)
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const existingBatches = await this.prisma.payoutBatch.count({
      where: {
        batchNumber: {
          startsWith: `PAYOUT-${year}-${month}`,
        },
      },
    });
    const batchNumber = `PAYOUT-${year}-${month}-${String(existingBatches + 1).padStart(3, '0')}`;

    // Get all providers with earnings
    const providerIds = await this.getProvidersWithEarnings(startDate, endDate);

    if (providerIds.length === 0) {
      throw new BadRequestException('No providers with earnings in this period');
    }

    // Calculate earnings for each provider
    const earningsList: ProviderEarnings[] = [];
    for (const providerId of providerIds) {
      const earnings = await this.calculateProviderEarnings(providerId, startDate, endDate);
      if (earnings.netAmount.greaterThan(0)) {
        earningsList.push(earnings);
      }
    }

    // Calculate batch totals
    const totalAmount = earningsList.reduce((sum, e) => sum.plus(e.netAmount), new Decimal(0));

    // Create payout batch
    const batch = await this.prisma.payoutBatch.create({
      data: {
        batchNumber,
        frequency,
        status: PayoutStatus.PENDING,
        startDate,
        endDate,
        totalAmount,
        totalCount: earningsList.length,
        currency: 'USD',
        notes,
      },
    });

    // Create payout statements for each provider
    for (const earnings of earningsList) {
      await this.prisma.payoutStatement.create({
        data: {
          batchId: batch.id,
          providerId: earnings.providerId,
          earnings: earnings.totalEarnings,
          platformFees: earnings.platformFees,
          refundsDeducted: earnings.refundsDeducted,
          netAmount: earnings.netAmount,
          status: PayoutStatus.PENDING,
          statementJson: JSON.parse(
            JSON.stringify({
              period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              },
              bookingCount: earnings.bookingCount,
              grossEarnings: earnings.totalEarnings.toString(),
              deductions: {
                platformFee: earnings.platformFees.toString(),
                refunds: earnings.refundsDeducted.toString(),
              },
              netPayout: earnings.netAmount.toString(),
            }),
          ),
        },
      });
    }

    this.logger.log(
      `Created payout batch ${batchNumber} with ${earningsList.length} statements, total: $${totalAmount}`,
    );

    return batch;
  }

  /**
   * Approve a payout batch (admin action)
   * Moves batch from PENDING to SCHEDULED
   */
  async approvePayoutBatch(batchId: string, adminId: string): Promise<PayoutBatch> {
    const batch = await this.prisma.payoutBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Payout batch not found: ${batchId}`);
    }

    if (batch.status !== PayoutStatus.PENDING) {
      throw new BadRequestException(`Batch is in ${batch.status} state, cannot approve`);
    }

    const updated = await this.prisma.payoutBatch.update({
      where: { id: batchId },
      data: {
        status: PayoutStatus.SCHEDULED,
        scheduledAt: new Date(),
      },
    });

    // Update all statements in batch to SCHEDULED
    await this.prisma.payoutStatement.updateMany({
      where: { batchId },
      data: { status: PayoutStatus.SCHEDULED },
    });

    this.logger.log(`Payout batch ${batchId} approved by ${adminId}`);

    return updated;
  }

  /**
   * Process a payout batch
   * Moves batch from SCHEDULED to IN_PROGRESS, then COMPLETED
   * In production, this would trigger Stripe Connect transfers
   */
  async processPayoutBatch(batchId: string): Promise<PayoutBatch> {
    const batch = await this.prisma.payoutBatch.findUnique({
      where: { id: batchId },
      include: { statements: true },
    });

    if (!batch) {
      throw new NotFoundException(`Payout batch not found: ${batchId}`);
    }

    if (batch.status !== PayoutStatus.SCHEDULED) {
      throw new BadRequestException(
        `Batch is in ${batch.status} state, only SCHEDULED batches can be processed`,
      );
    }

    // Mark batch as in progress
    await this.prisma.payoutBatch.update({
      where: { id: batchId },
      data: { status: PayoutStatus.IN_PROGRESS },
    });

    // Process each statement (in production: trigger Stripe Connect transfer)
    for (const statement of batch.statements) {
      // TODO: Integrate with Stripe Connect
      // const transferId = await this.stripeService.createTransfer({
      //   amount: statement.netAmount,
      //   destination: provider.stripeAccountId,
      //   description: `Payout for batch ${batch.batchNumber}`,
      // });

      // For now, mark as COMPLETED immediately
      await this.prisma.payoutStatement.update({
        where: { id: statement.id },
        data: {
          status: PayoutStatus.COMPLETED,
          // transferId: transferId,
        },
      });
    }

    // Mark batch as completed
    const completed = await this.prisma.payoutBatch.update({
      where: { id: batchId },
      data: {
        status: PayoutStatus.COMPLETED,
        processedAt: new Date(),
      },
    });

    this.logger.log(`Payout batch ${batchId} processed: ${batch.statements.length} transfers`);

    return completed;
  }

  /**
   * Cron job: Create weekly payout batches (every Monday at 9 AM)
   */
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'weekly-payout-batch',
    timeZone: 'UTC',
  })
  async createWeeklyPayoutBatch() {
    this.logger.log('Running weekly payout batch creation...');

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() - 1); // Yesterday
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6); // 7 days ago
    startDate.setHours(0, 0, 0, 0);

    try {
      const batch = await this.createPayoutBatch({
        frequency: PayoutScheduleFrequency.WEEKLY,
        startDate,
        endDate,
        notes: 'Automatically generated weekly payout batch',
      });

      this.logger.log(`Weekly payout batch created: ${batch.batchNumber}`);
    } catch (error: any) {
      if (error.message && error.message.includes('No providers with earnings')) {
        this.logger.log('No earnings to payout this week, skipping batch');
      } else {
        this.logger.error('Failed to create weekly payout batch', error?.stack || error);
      }
    }
  }

  /**
   * Cron job: Create monthly payout batches (1st day of month at 9 AM)
   */
  @Cron('0 9 1 * *', {
    name: 'monthly-payout-batch',
    timeZone: 'UTC',
  })
  async createMonthlyPayoutBatch() {
    this.logger.log('Running monthly payout batch creation...');

    const now = new Date();
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1); // First day of previous month
    startDate.setHours(0, 0, 0, 0);

    try {
      const batch = await this.createPayoutBatch({
        frequency: PayoutScheduleFrequency.MONTHLY,
        startDate,
        endDate,
        notes: 'Automatically generated monthly payout batch',
      });

      this.logger.log(`Monthly payout batch created: ${batch.batchNumber}`);
    } catch (error: any) {
      if (error.message && error.message.includes('No providers with earnings')) {
        this.logger.log('No earnings to payout this month, skipping batch');
      } else {
        this.logger.error('Failed to create monthly payout batch', error?.stack || error);
      }
    }
  }

  /**
   * Get payout batch by ID
   */
  async getPayoutBatch(batchId: string): Promise<PayoutBatch | null> {
    return this.prisma.payoutBatch.findUnique({
      where: { id: batchId },
      include: { statements: true },
    });
  }

  /**
   * Get all payout batches
   */
  async getAllPayoutBatches(): Promise<PayoutBatch[]> {
    return this.prisma.payoutBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: { statements: true },
    });
  }

  /**
   * Get payout batches by status
   */
  async getPayoutBatchesByStatus(status: PayoutStatus): Promise<PayoutBatch[]> {
    return this.prisma.payoutBatch.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      include: { statements: true },
    });
  }

  /**
   * Get payout statement by ID
   */
  async getPayoutStatement(statementId: string): Promise<PayoutStatement | null> {
    return this.prisma.payoutStatement.findUnique({
      where: { id: statementId },
      include: { batch: true, provider: true },
    });
  }

  /**
   * Get all payout statements for a provider
   */
  async getProviderPayoutStatements(providerId: string): Promise<PayoutStatement[]> {
    return this.prisma.payoutStatement.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
      include: { batch: true },
    });
  }

  /**
   * Get pending payout batches (admin dashboard)
   */
  async getPendingPayoutBatches(): Promise<PayoutBatch[]> {
    return this.prisma.payoutBatch.findMany({
      where: { status: PayoutStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: { statements: true },
    });
  }

  /**
   * Get provider payout statistics
   */
  async getProviderPayoutStats(providerId: string): Promise<{
    totalEarnings: Decimal;
    totalPaidOut: Decimal;
    pendingPayout: Decimal;
    payoutCount: number;
    lastPayoutDate: Date | null;
  }> {
    const statements = await this.prisma.payoutStatement.findMany({
      where: { providerId },
    });

    const totalEarnings = statements.reduce(
      (sum: Decimal, s: PayoutStatement) => sum.plus(s.earnings),
      new Decimal(0),
    );

    const totalPaidOut = statements
      .filter((s: PayoutStatement) => s.status === PayoutStatus.COMPLETED)
      .reduce((sum: Decimal, s: PayoutStatement) => sum.plus(s.netAmount), new Decimal(0));

    const pendingPayout = statements
      .filter(
        (s: PayoutStatement) =>
          s.status === PayoutStatus.PENDING ||
          s.status === PayoutStatus.SCHEDULED ||
          s.status === PayoutStatus.IN_PROGRESS,
      )
      .reduce((sum: Decimal, s: PayoutStatement) => sum.plus(s.netAmount), new Decimal(0));

    const completedStatements = statements.filter(
      (s: PayoutStatement) => s.status === PayoutStatus.COMPLETED,
    );
    const lastPayoutDate =
      completedStatements.length > 0
        ? completedStatements[completedStatements.length - 1].updatedAt
        : null;

    return {
      totalEarnings,
      totalPaidOut,
      pendingPayout,
      payoutCount: statements.length,
      lastPayoutDate,
    };
  }
}
