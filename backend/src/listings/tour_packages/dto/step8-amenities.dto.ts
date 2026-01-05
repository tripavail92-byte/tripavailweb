import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class Step8AmenitiesDto {
  @ApiProperty({
    description: 'Array of amenity IDs to link to this tour package',
    example: ['amenity_id_1', 'amenity_id_2'],
    minItems: 1,
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @ArrayMinSize(1, { message: 'At least one amenity ID is required' })
  amenityIds!: string[];
}
