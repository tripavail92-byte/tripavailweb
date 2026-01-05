import { IsString, IsDateString, IsInt, Min, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuoteDto {
  @ApiProperty({ description: 'Package type', enum: ['HOTEL_PACKAGE', 'TOUR_PACKAGE'] })
  @IsEnum(['HOTEL_PACKAGE', 'TOUR_PACKAGE'])
  packageType!: 'HOTEL_PACKAGE' | 'TOUR_PACKAGE';

  @ApiProperty({ description: 'Package ID (UUID)' })
  @IsString()
  packageId!: string;

  @ApiProperty({ description: 'Check-in date (ISO 8601)', example: '2025-01-15' })
  @IsDateString()
  checkInDate!: string;

  @ApiProperty({ description: 'Check-out date (ISO 8601)', example: '2025-01-20', required: false })
  @IsDateString()
  @IsOptional()
  checkOutDate?: string;

  @ApiProperty({ description: 'Departure date for tours (ISO 8601)', example: '2025-01-15', required: false })
  @IsDateString()
  @IsOptional()
  departureDate?: string;

  @ApiProperty({ description: 'Number of guests', minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  numberOfGuests!: number;

  @ApiProperty({ description: 'Number of rooms', minimum: 1, example: 1, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  numberOfRooms?: number;

  @ApiProperty({ description: 'Selected room IDs for hotel packages', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedRoomIds?: string[];

  @ApiProperty({ description: 'Selected add-on IDs', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedAddOns?: string[];

  @ApiProperty({ description: 'Idempotency key for duplicate prevention', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
