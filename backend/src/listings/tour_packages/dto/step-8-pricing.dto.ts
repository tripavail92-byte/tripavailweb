import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';

enum CancellationPolicy {
  FLEXIBLE = 'FLEXIBLE',
  MODERATE = 'MODERATE',
  STRICT = 'STRICT',
}

export class Step8PricingPoliciesDto {
  @ApiProperty({ example: '1500.00' })
  @IsDecimal()
  pricePerPerson!: string;

  @ApiProperty({ enum: CancellationPolicy, example: 'FLEXIBLE' })
  @IsEnum(CancellationPolicy)
  cancellationPolicy!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  minPeople!: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Max(100)
  maxPeople!: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  earlyBirdDiscount?: boolean;

  @ApiProperty({ example: '10.00', required: false })
  @IsDecimal()
  @IsOptional()
  earlyBirdPercentage?: string;

  @ApiProperty({ example: '7_DAYS', required: false })
  @IsString()
  @IsOptional()
  bestPriceGuarantee?: string;
}
