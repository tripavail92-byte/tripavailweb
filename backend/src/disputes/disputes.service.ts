import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  WON = 'WON',
  LOST = 'LOST',
  CLOSED = 'CLOSED',
}

export enum DisputeReason {
  FRAUDULENT = 'FRAUDULENT',
  DUPLICATE = 'DUPLICATE',
  PRODUCT_NOT_RECEIVED = 'PRODUCT_NOT_RECEIVED',
  PRODUCT_UNACCEPTABLE = 'PRODUCT_UNACCEPTABLE',
  SUBSCRIPTION_CANCELED = 'SUBSCRIPTION_CANCELED',
  CREDIT_NOT_PROCESSED = 'CREDIT_NOT_PROCESSED',
  GENERAL = 'GENERAL',
}

export interface CreateDisputeRequest {
  bookingId: string;
  chargeId: string;
  stripeDisputeId: string;
  amount: number;
  reason: DisputeReason;
  evidence?: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  chargeId: string;
  stripeDisputeId: string;
  amount: number;
  status: DisputeStatus;
  reason: DisputeReason;
  evidence?: string;
  outcome?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Disputes Service
 * Handles chargebacks and payment disputes
 * 
 * Dispute Flow:
 * 1. Stripe notifies us of dispute via webhook (charge.dispute.created)
 * 2. Create dispute record in database
 * 3. Notify admin/provider of dispute
 * 4. Provider submits evidence to Stripe
 * 5. Stripe resolves dispute (won/lost)
 * 6. If lost, refund is automatically processed
 * 7. If won, charge is retained
 * 
 * Note: In production, disputes should be stored in a dedicated table.
 * For now, we'll store them in JSON metadata or create a simple in-memory store.
 */
@Injectable()
export class DisputesService {
  private readonly logger = new Logger(DisputesService.name);
  
  // In-memory store for MVP (replace with database table in production)
  private disputes: Map<string, Dispute> = new Map();

  constructor(
    // @ts-expect-error - PrismaService reserved for future database migration
    private readonly _prisma: PrismaService,
  ) {}

  /**
   * Create a new dispute record
   */
  async createDispute(req: CreateDisputeRequest): Promise<Dispute> {
    const dispute: Dispute = {
      id: `dispute_${Date.now()}`,
      bookingId: req.bookingId,
      chargeId: req.chargeId,
      stripeDisputeId: req.stripeDisputeId,
      amount: req.amount,
      status: DisputeStatus.OPEN,
      reason: req.reason,
      evidence: req.evidence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.disputes.set(dispute.id, dispute);

    this.logger.log(
      `Dispute created: ${dispute.id} for booking ${req.bookingId}, amount: $${(req.amount / 100).toFixed(2)}`,
    );

    // TODO: Notify admin and provider
    // TODO: Hold provider payout if applicable

    return dispute;
  }

  /**
   * Update dispute status
   */
  async updateDispute(
    disputeId: string,
    status: DisputeStatus,
    outcome?: string,
  ): Promise<Dispute> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new NotFoundException(`Dispute not found: ${disputeId}`);
    }

    dispute.status = status;
    dispute.outcome = outcome;
    dispute.updatedAt = new Date();

    this.disputes.set(disputeId, dispute);

    this.logger.log(`Dispute ${disputeId} updated: status=${status}, outcome=${outcome}`);

    return dispute;
  }

  /**
   * Get dispute by ID
   */
  async getDispute(disputeId: string): Promise<Dispute | null> {
    return this.disputes.get(disputeId) || null;
  }

  /**
   * Get dispute by Stripe dispute ID
   */
  async getDisputeByStripeId(stripeDisputeId: string): Promise<Dispute | null> {
    for (const dispute of this.disputes.values()) {
      if (dispute.stripeDisputeId === stripeDisputeId) {
        return dispute;
      }
    }
    return null;
  }

  /**
   * Get disputes for a booking
   */
  async getDisputesForBooking(bookingId: string): Promise<Dispute[]> {
    const disputes: Dispute[] = [];
    for (const dispute of this.disputes.values()) {
      if (dispute.bookingId === bookingId) {
        disputes.push(dispute);
      }
    }
    return disputes;
  }

  /**
   * Get all disputes
   */
  async getAllDisputes(): Promise<Dispute[]> {
    return Array.from(this.disputes.values());
  }

  /**
   * Get disputes by status
   */
  async getDisputesByStatus(status: DisputeStatus): Promise<Dispute[]> {
    const disputes: Dispute[] = [];
    for (const dispute of this.disputes.values()) {
      if (dispute.status === status) {
        disputes.push(dispute);
      }
    }
    return disputes;
  }

  /**
   * Add evidence to a dispute
   */
  async addEvidence(disputeId: string, evidence: string): Promise<Dispute> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new NotFoundException(`Dispute not found: ${disputeId}`);
    }

    dispute.evidence = evidence;
    dispute.updatedAt = new Date();

    this.disputes.set(disputeId, dispute);

    this.logger.log(`Evidence added to dispute ${disputeId}`);

    return dispute;
  }

  /**
   * Get dispute statistics
   */
  async getDisputeStatistics(): Promise<{
    totalDisputes: number;
    openDisputes: number;
    wonDisputes: number;
    lostDisputes: number;
    totalDisputedAmount: number;
  }> {
    const allDisputes = Array.from(this.disputes.values());

    return {
      totalDisputes: allDisputes.length,
      openDisputes: allDisputes.filter(
        (d) => d.status === DisputeStatus.OPEN || d.status === DisputeStatus.UNDER_REVIEW,
      ).length,
      wonDisputes: allDisputes.filter((d) => d.status === DisputeStatus.WON).length,
      lostDisputes: allDisputes.filter((d) => d.status === DisputeStatus.LOST).length,
      totalDisputedAmount: allDisputes.reduce((sum, d) => sum + d.amount, 0),
    };
  }
}
