import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOperatorProfileDto {
  @ApiPropertyOptional({ example: 'Bangkok', description: 'Base city for tours' })
  @IsOptional()
  @IsString()
  baseCity?: string;

  @ApiPropertyOptional({ example: 13.7563, description: 'Base latitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  baseLatitude?: number;

  @ApiPropertyOptional({ example: 100.5018, description: 'Base longitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  baseLongitude?: number;

  @ApiPropertyOptional({
    example: 'Grand Plaza Hotel, 123 Main Street',
    description: 'Meeting point address for pickups',
  })
  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @ApiPropertyOptional({ example: '+66812345678', description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}
