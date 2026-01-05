import { Decimal } from '@prisma/client/runtime/library';
import { CancellationPolicyType } from '@prisma/client';

/**
 * Refund Calculation Engine
 * Applies cancellation policies to booking cancellations
 * Always uses policy snapshot stored at booking confirmation
 */

export interface CancellationPolicyRule {
  type: CancellationPolicyType;
  name: string;
  fullRefundUntilDays: number;
  partialRefundUntilDays?: number;
  noRefundUntilDays?: number;
  partialRefundPercentage?: number; // e.g., 50 for 50%
}

export const CANCELLATION_POLICY_RULES: Record<
  CancellationPolicyType,
  CancellationPolicyRule
> = {
  FLEXIBLE: {
    type: CancellationPolicyType.FLEXIBLE,
    name: 'Flexible',
    fullRefundUntilDays: 7,
    partialRefundUntilDays: 0,
    noRefundUntilDays: 0,
    partialRefundPercentage: 100,
  },
  MODERATE: {
    type: CancellationPolicyType.MODERATE,
    name: 'Moderate',
    fullRefundUntilDays: 3,
    partialRefundUntilDays: 1,
    noRefundUntilDays: 0,
    partialRefundPercentage: 50,
  },
  STRICT: {
    type: CancellationPolicyType.STRICT,
    name: 'Strict',
    fullRefundUntilDays: 1,
    partialRefundUntilDays: 0,
    noRefundUntilDays: 0,
    partialRefundPercentage: 0,
  },
  NON_REFUNDABLE: {
    type: CancellationPolicyType.NON_REFUNDABLE,
    name: 'Non-Refundable',
    fullRefundUntilDays: 0,
    partialRefundUntilDays: 0,
    noRefundUntilDays: 0,
    partialRefundPercentage: 0,
  },
};

export interface RefundCalculation {
  refundPercentage: number; // 0-100
  refundAmount: Decimal;
  platformFeeDeducted: Decimal;
  netRefundAmount: Decimal;
  reason: string;
  policyApplied: CancellationPolicyType;
  daysUntilCheckIn: number;
}

export interface RefundInput {
  totalBookingPrice: Decimal | number;
  platformFeeAmount: Decimal | number;
  cancellationPolicy: CancellationPolicyType;
  checkInDate: Date;
  cancellationRequestedAt: Date;
  cancellationReason?: string;
}

/**
 * Calculate refund based on cancellation policy
 * Policy snapshot should be provided from booking confirmation
 */
export function calculateRefund(input: RefundInput): RefundCalculation {
  const {
    totalBookingPrice,
    platformFeeAmount,
    cancellationPolicy,
    checkInDate,
    cancellationRequestedAt,
  } = input;

  const policy = CANCELLATION_POLICY_RULES[cancellationPolicy];
  if (!policy) {
    throw new Error(`Invalid cancellation policy: ${cancellationPolicy}`);
  }

  // Calculate days until check-in
  const now = new Date(cancellationRequestedAt);
  const checkIn = new Date(checkInDate);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const daysUntilCheckIn = Math.floor(
    (checkIn.getTime() - now.getTime()) / millisecondsPerDay,
  );

  // Determine refund percentage based on cancellation timing
  let refundPercentage = 0;
  let reason = '';

  if (daysUntilCheckIn >= policy.fullRefundUntilDays) {
    // Full refund
    refundPercentage = 100;
    reason = `${policy.name} policy: Full refund (cancelled ${daysUntilCheckIn} days before check-in)`;
  } else if (
    policy.partialRefundUntilDays !== undefined &&
    daysUntilCheckIn >= policy.partialRefundUntilDays
  ) {
    // Partial refund
    refundPercentage = policy.partialRefundPercentage || 50;
    reason = `${policy.name} policy: Partial refund ${refundPercentage}% (cancelled ${daysUntilCheckIn} days before check-in)`;
  } else {
    // No refund
    refundPercentage = 0;
    reason = `${policy.name} policy: No refund (cancelled ${daysUntilCheckIn} days before check-in)`;
  }

  // Calculate refund amounts
  const bookingPrice = new Decimal(totalBookingPrice);
  const feeAmount = new Decimal(platformFeeAmount);

  // Refund is calculated on the base booking price (before fees)
  const refundAmount = bookingPrice.mul(refundPercentage).div(100);

  // Platform fee is NOT refunded (kept by platform)
  const netRefundAmount = refundAmount;

  return {
    refundPercentage,
    refundAmount,
    platformFeeDeducted: feeAmount,
    netRefundAmount,
    reason,
    policyApplied: cancellationPolicy,
    daysUntilCheckIn,
  };
}

/**
 * Extract cancellation policy from booking's policy snapshot
 */
export function extractCancellationPolicy(
  cancellationPolicyJson: any,
): CancellationPolicyType | null {
  if (!cancellationPolicyJson) return null;

  // Support both direct type and nested structure
  if (typeof cancellationPolicyJson === 'string') {
    return cancellationPolicyJson as CancellationPolicyType;
  }

  if (typeof cancellationPolicyJson === 'object' && cancellationPolicyJson.type) {
    return cancellationPolicyJson.type;
  }

  return null;
}

/**
 * Extract booking price breakdown from price snapshot
 */
export function extractPriceBreakdown(priceSnapshot: any): {
  basePrice: Decimal;
  tax: Decimal;
  commission: Decimal;
  total: Decimal;
} {
  if (!priceSnapshot) {
    throw new Error('Price snapshot not found on booking');
  }

  const snapshot =
    typeof priceSnapshot === 'string'
      ? JSON.parse(priceSnapshot)
      : priceSnapshot;

  return {
    basePrice: new Decimal(snapshot.basePrice || 0),
    tax: new Decimal(snapshot.tax || 0),
    commission: new Decimal(snapshot.commission || 0),
    total: new Decimal(snapshot.total || 0),
  };
}
