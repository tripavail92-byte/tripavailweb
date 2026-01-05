import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class DiscountSettingsDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  discountEnabled?: boolean;

  @ApiProperty({ example: 10.0, minimum: 0, maximum: 100, required: false })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercentage?: number;

  @ApiProperty({ example: '2025-12-31T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  discountStartDate?: string;

  @ApiProperty({ example: '2026-01-31T00:00:00.000Z', required: false })
  @IsDateString()
  @IsOptional()
  discountEndDate?: string;
}
