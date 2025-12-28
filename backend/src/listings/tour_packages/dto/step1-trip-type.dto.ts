import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Step1TripTypeDto {
  @ApiProperty({ example: 'Adventure' })
  @IsString()
  @IsNotEmpty()
  tripType!: string;
}
