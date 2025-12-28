import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CancellationPolicy {
  FLEXIBLE = 'FLEXIBLE',
  MODERATE = 'MODERATE',
  STRICT = 'STRICT',
  NON_REFUNDABLE = 'NON_REFUNDABLE',
}

export enum PaymentTerms {
  FULL_AT_BOOKING = 'FULL_AT_BOOKING',
  DEPOSIT_PLUS_BALANCE = 'DEPOSIT_PLUS_BALANCE',
  PAY_AT_ARRIVAL = 'PAY_AT_ARRIVAL',
}

export class HotelStep6PoliciesDto {
  @ApiProperty({ example: '15:00', description: 'Check-in time (24h format)' })
  @IsString()
  @IsNotEmpty()
  checkInTime!: string;

  @ApiProperty({ example: '11:00', description: 'Check-out time (24h format)' })
  @IsString()
  @IsNotEmpty()
  checkOutTime!: string;

  @ApiProperty({ enum: CancellationPolicy, example: 'FLEXIBLE' })
  @IsEnum(CancellationPolicy)
  cancellationPolicy!: CancellationPolicy;

  @ApiProperty({ enum: PaymentTerms, example: 'FULL_AT_BOOKING' })
  @IsEnum(PaymentTerms)
  paymentTerms!: PaymentTerms;

  @ApiPropertyOptional({ example: 'No smoking. No pets. Quiet hours 10 PM - 7 AM.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  houseRules?: string;

  @ApiPropertyOptional({ example: 'Guests under 18 must be accompanied by an adult.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ageRestrictions?: string;
}
