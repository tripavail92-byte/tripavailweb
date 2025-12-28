import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HotelStep5AmenitiesDto {
  @ApiProperty({
    example: ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'parking'],
    description: 'Array of amenity IDs or names',
  })
  @IsArray()
  @IsString({ each: true })
  amenities!: string[];
}
