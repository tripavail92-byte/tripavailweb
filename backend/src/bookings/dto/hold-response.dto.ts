import { ApiProperty } from '@nestjs/swagger';

export class HoldResponseDto {
  @ApiProperty({ description: 'Booking ID' })
  id!: string;

  @ApiProperty({ description: 'Hold status', enum: ['HOLD'] })
  status!: 'HOLD';

  @ApiProperty({ description: 'Hold expiration timestamp (10 minutes from creation)' })
  holdExpiresAt!: Date;

  @ApiProperty({ description: 'Package type' })
  packageType!: string;

  @ApiProperty({ description: 'Package ID' })
  packageId!: string;

  @ApiProperty({ description: 'Number of guests' })
  numberOfGuests!: number;

  @ApiProperty({ description: 'Total price' })
  totalPrice!: number;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Price snapshot' })
  priceSnapshot!: any;

  @ApiProperty({ description: 'Hold creation timestamp' })
  heldAt!: Date;
}
