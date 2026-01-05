import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHoldDto {
  @ApiProperty({ description: 'Quote ID (booking in QUOTE state)' })
  @IsString()
  quoteId!: string;

  @ApiProperty({ description: 'Idempotency key for duplicate prevention', required: false })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
