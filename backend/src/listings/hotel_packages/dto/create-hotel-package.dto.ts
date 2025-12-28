import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsIn,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HOTEL_PACKAGE_TEMPLATE_IDS } from '../hotel-package-templates';

export class CreateHotelPackageDto {
  @ApiProperty({
    example: 'weekend-getaway',
    enum: HOTEL_PACKAGE_TEMPLATE_IDS,
  })
  @IsString()
  @IsIn(HOTEL_PACKAGE_TEMPLATE_IDS)
  templateId!: string;

  @ApiProperty({ example: 'listing_cuid' })
  @IsString()
  @IsNotEmpty()
  listingId!: string;

  @ApiProperty({ example: 'Romantic Weekend' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Two nights with breakfast and spa access.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 399.99 })
  @IsNumber()
  pricePerPerson!: number;

  @ApiProperty({ example: ['Breakfast', 'Spa access'], required: false })
  @IsArray()
  @IsOptional()
  inclusions?: string[];

  @ApiProperty({ example: ['Flights not included'], required: false })
  @IsArray()
  @IsOptional()
  exclusions?: string[];

  @ApiProperty({ example: 'WEEKEND_ONLY', enum: ['WEEKEND_ONLY', 'SEASONAL', 'FLEXIBLE'] })
  @IsString()
  @IsIn(['WEEKEND_ONLY', 'SEASONAL', 'FLEXIBLE'])
  availabilityRule!: string;

  @ApiProperty({
    example: ['amenity_cuid1', 'amenity_cuid2'],
    required: false,
    description: 'Amenity IDs to attach',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  amenityIds?: string[];
}
