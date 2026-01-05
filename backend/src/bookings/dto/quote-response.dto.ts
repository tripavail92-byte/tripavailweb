import { ApiProperty } from '@nestjs/swagger';

export class QuoteResponseDto {
  @ApiProperty({ description: 'Quote ID (Booking ID in QUOTE status)' })
  id!: string;

  @ApiProperty({ description: 'Quote status', enum: ['QUOTE'] })
  status!: 'QUOTE';

  @ApiProperty({ description: 'Package type' })
  packageType!: string;

  @ApiProperty({ description: 'Package ID' })
  packageId!: string;

  @ApiProperty({ description: 'Check-in date' })
  checkInDate?: Date;

  @ApiProperty({ description: 'Check-out date' })
  checkOutDate?: Date;

  @ApiProperty({ description: 'Departure date for tours' })
  departureDate?: Date;

  @ApiProperty({ description: 'Number of guests' })
  numberOfGuests!: number;

  @ApiProperty({ description: 'Number of rooms' })
  numberOfRooms?: number;

  @ApiProperty({ description: 'Price snapshot with breakdown' })
  priceSnapshot!: {
    basePrice: number;
    tax: number;
    commission: number;
    total: number;
    breakdown?: any;
  };

  @ApiProperty({ description: 'Total price' })
  totalPrice!: number;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Cancellation policy type' })
  cancellationPolicy?: string;

  @ApiProperty({ description: 'Cancellation policy details' })
  cancellationPolicyJson?: any;

  @ApiProperty({ description: 'Quote creation timestamp' })
  quotedAt!: Date;

  @ApiProperty({ description: 'Quote expiration (24 hours from creation)' })
  expiresAt!: Date;
}
