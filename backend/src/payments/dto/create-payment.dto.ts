import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Day 38: Payment Pre-Authorization Request DTO
 * 
 * Initiates payment hold on traveler's card without capturing funds.
 * Requires a valid HOLD booking (status=HOLD, holdExpiresAt > now).
 */
export class CreatePaymentDto {
  @ApiProperty({
    description: 'Booking ID in HOLD state',
    example: 'clq123abc',
  })
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @ApiProperty({
    description: 'Stripe Payment Method ID (e.g., pm_xxx)',
    example: 'pm_1MockPaymentMethodId',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId!: string;

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate charges',
    example: 'idem_booking_clq123abc_payment',
  })
  @IsString()
  @IsNotEmpty()
  idempotencyKey!: string;
}
