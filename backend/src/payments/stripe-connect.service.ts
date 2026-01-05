import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface CreateTransferRequest {
  amount: number; // Amount in cents (e.g., 10000 = $100.00)
  destinationAccountId: string; // Stripe Connect account ID
  description: string;
  metadata?: Record<string, string>;
}

export interface CreateTransferResponse {
  transferId: string;
  amount: number;
  status: string;
  destination: string;
  created: Date;
}

export interface RefundTransferRequest {
  transferId: string;
  amount?: number; // Optional: partial refund
  reason?: string;
}

/**
 * Stripe Connect Service for Payouts
 * Handles bank transfers to provider Stripe Connect accounts
 * 
 * Prerequisites:
 * - Providers must complete Stripe Connect onboarding
 * - Provider Stripe account IDs stored in ProviderProfile.stripeAccountId
 * 
 * Transfer Flow:
 * 1. Create transfer to provider's Stripe Connect account
 * 2. Stripe handles bank transfer to provider's bank account
 * 3. Webhook notifies us when transfer completes/fails
 */
@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  /**
   * Create a transfer to a provider's Stripe Connect account
   * This moves funds from the platform's Stripe account to the provider's account
   */
  async createTransfer(req: CreateTransferRequest): Promise<CreateTransferResponse> {
    const { amount, destinationAccountId, description, metadata } = req;

    this.logger.log(
      `Creating transfer: $${(amount / 100).toFixed(2)} to ${destinationAccountId}`,
    );

    try {
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount), // Amount in cents
        currency: 'usd',
        destination: destinationAccountId,
        description,
        metadata: metadata || {},
      });

      this.logger.log(`Transfer created: ${transfer.id}`);

      return {
        transferId: transfer.id,
        amount: transfer.amount,
        status: 'created',
        destination: transfer.destination as string,
        created: new Date(transfer.created * 1000),
      };
    } catch (error: any) {
      this.logger.error(`Stripe transfer failed: ${error.message}`, error.stack);
      throw new Error(`Stripe transfer failed: ${error.message}`);
    }
  }

  /**
   * Retrieve transfer status from Stripe
   */
  async getTransfer(transferId: string): Promise<Stripe.Transfer> {
    try {
      return await this.stripe.transfers.retrieve(transferId);
    } catch (error: any) {
      this.logger.error(`Failed to retrieve transfer ${transferId}: ${error.message}`);
      throw new Error(`Failed to retrieve transfer: ${error.message}`);
    }
  }

  /**
   * Reverse a transfer (in case of refund or dispute)
   * Creates a reversal which moves funds back from provider to platform
   */
  async reverseTransfer(req: RefundTransferRequest): Promise<Stripe.TransferReversal> {
    const { transferId, amount, reason } = req;

    this.logger.log(`Reversing transfer ${transferId}: ${amount ? `$${(amount / 100).toFixed(2)}` : 'full amount'}`);

    try {
      const reversal = await this.stripe.transfers.createReversal(transferId, {
        amount: amount ? Math.round(amount) : undefined,
        description: reason,
      });

      this.logger.log(`Transfer reversed: ${reversal.id}`);

      return reversal;
    } catch (error: any) {
      this.logger.error(`Transfer reversal failed: ${error.message}`, error.stack);
      throw new Error(`Transfer reversal failed: ${error.message}`);
    }
  }

  /**
   * Create a Stripe Connect account link for provider onboarding
   * Provider clicks this link to complete Stripe Connect setup
   */
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string,
  ): Promise<string> {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return accountLink.url;
    } catch (error: any) {
      this.logger.error(`Failed to create account link: ${error.message}`);
      throw new Error(`Failed to create account link: ${error.message}`);
    }
  }

  /**
   * Create a Stripe Connect Express account for a provider
   * Returns account ID to store in ProviderProfile
   */
  async createConnectAccount(
    email: string,
    businessName: string,
    country: string = 'US',
  ): Promise<string> {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        country,
        email,
        business_profile: {
          name: businessName,
        },
        capabilities: {
          transfers: { requested: true },
        },
      });

      this.logger.log(`Stripe Connect account created: ${account.id}`);

      return account.id;
    } catch (error: any) {
      this.logger.error(`Failed to create Connect account: ${error.message}`);
      throw new Error(`Failed to create Connect account: ${error.message}`);
    }
  }

  /**
   * Get Stripe Connect account details
   */
  async getConnectAccount(accountId: string): Promise<Stripe.Account> {
    try {
      return await this.stripe.accounts.retrieve(accountId);
    } catch (error: any) {
      this.logger.error(`Failed to retrieve account ${accountId}: ${error.message}`);
      throw new Error(`Failed to retrieve account: ${error.message}`);
    }
  }

  /**
   * Check if Stripe Connect account is fully onboarded
   */
  async isAccountOnboarded(accountId: string): Promise<boolean> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return account.charges_enabled && account.payouts_enabled;
    } catch (error: any) {
      this.logger.error(`Failed to check account status: ${error.message}`);
      return false;
    }
  }

  /**
   * Get payout details from Stripe
   * (Stripe automatically sends payouts to provider's bank account)
   */
  async getPayout(payoutId: string): Promise<Stripe.Payout> {
    try {
      return await this.stripe.payouts.retrieve(payoutId);
    } catch (error: any) {
      this.logger.error(`Failed to retrieve payout ${payoutId}: ${error.message}`);
      throw new Error(`Failed to retrieve payout: ${error.message}`);
    }
  }

  /**
   * List recent transfers for a Connect account
   */
  async listAccountTransfers(
    accountId: string,
    limit: number = 10,
  ): Promise<Stripe.Transfer[]> {
    try {
      const transfers = await this.stripe.transfers.list({
        destination: accountId,
        limit,
      });
      return transfers.data;
    } catch (error: any) {
      this.logger.error(`Failed to list transfers: ${error.message}`);
      throw new Error(`Failed to list transfers: ${error.message}`);
    }
  }
}
