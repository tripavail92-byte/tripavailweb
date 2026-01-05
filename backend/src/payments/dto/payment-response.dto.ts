import { ApiProperty } from '@nestjs/swagger';

/**
 * Day 38: Payment Pre-Authorization Response DTO
 * 
 * Returns payment status after pre-authorization attempt.
 */
export class PaymentResponseDto {
  @ApiProperty({
    description: 'Payment record ID',
    example: 'clq789xyz',
  })
  id!: string;

  @ApiProperty({
    description: 'Associated booking ID',
    example: 'clq123abc',
  })
  bookingId!: string;

  @ApiProperty({
    description: 'Payment status',
    enum: ['PRE_AUTHORIZED', 'CONFIRMED', 'CAPTURED', 'FAILED', 'REFUNDED'],
    example: 'PRE_AUTHORIZED',
  })
  status!: string;

  @ApiProperty({
    description: 'Total amount (pre-authorized, not yet captured)',
    example: 450.0,
  })
  amount!: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency!: string;

  @ApiProperty({
    description: 'Stripe Payment Intent ID',
    example: 'pi_1MockPaymentIntentId',
  })
  paymentIntentId!: string;

  @ApiProperty({
    description: 'Updated booking status after payment',
    enum: ['QUOTE', 'HOLD', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED', 'EXPIRED_HOLD', 'CANCELLED_BY_GUEST', 'CANCELLED_BY_PROVIDER'],
    example: 'PAYMENT_PENDING',
  })
  bookingStatus!: string;

  @ApiProperty({
    description: 'Payment creation timestamp',
    example: '2026-01-04T02:45:00Z',
  })
  createdAt!: Date;
}
