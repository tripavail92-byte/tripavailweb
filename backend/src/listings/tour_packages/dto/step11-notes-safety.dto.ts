import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength, ArrayMaxSize } from 'class-validator';

export class Step11NotesSafetyDto {
  @ApiProperty({ example: 'Please bring your passport and travel insurance.', maxLength: 1000, required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  specialNotes?: string;

  @ApiProperty({ example: ['Wear comfortable shoes', 'No pets allowed'], type: [String], maxItems: 10, required: false })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  safetyInformation?: string[];
}
