import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { HOTEL_PACKAGE_TEMPLATE_IDS } from '../hotel-package-templates';

export class UpdateHotelPackageDto {
  @ApiPropertyOptional({
    example: 'weekend-getaway',
    enum: HOTEL_PACKAGE_TEMPLATE_IDS,
  })
  @IsOptional()
  @IsString()
  @IsIn(HOTEL_PACKAGE_TEMPLATE_IDS)
  templateId?: string;

  @ApiPropertyOptional({ example: 'Romantic Weekend' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Two nights with breakfast and spa access.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 399.99 })
  @IsOptional()
  @IsNumber()
  pricePerPerson?: number;

  @ApiPropertyOptional({ example: ['Breakfast', 'Spa access'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  inclusions?: string[];

  @ApiPropertyOptional({ example: ['Flights not included'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exclusions?: string[];

  @ApiPropertyOptional({ example: 'WEEKEND_ONLY', enum: ['WEEKEND_ONLY', 'SEASONAL', 'FLEXIBLE'] })
  @IsOptional()
  @IsString()
  @IsIn(['WEEKEND_ONLY', 'SEASONAL', 'FLEXIBLE'])
  availabilityRule?: string;

  @ApiPropertyOptional({
    example: ['amenity_cuid1', 'amenity_cuid2'],
    description: 'Replace amenities on the package (DRAFT only)',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  amenityIds?: string[];
}
