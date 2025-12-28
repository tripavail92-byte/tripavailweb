import {
  IsString,
  IsNotEmpty,
  IsLatitude,
  IsLongitude,
  Length,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateListingDto {
  @ApiProperty({ example: 'Beachfront Villa' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '123 Ocean Drive' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiProperty({ example: 'Miami' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 25.790654 })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: -80.1300455 })
  @IsLongitude()
  longitude!: number;

  @ApiProperty({ example: 'Spacious villa with ocean views' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  @Length(4, 10)
  checkInTime!: string; // e.g., "14:00"

  @ApiProperty({ example: '11:00' })
  @IsString()
  @Length(4, 10)
  checkOutTime!: string; // e.g., "11:00"

  @ApiProperty({
    example: ['amenity_cuid1', 'amenity_cuid2'],
    required: false,
    description: 'Amenity IDs to attach',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  amenityIds?: string[];
}
