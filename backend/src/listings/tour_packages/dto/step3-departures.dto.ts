import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsInt, Min } from 'class-validator';

export class Step3DeparturesDto {
  @ApiProperty({ example: ['2026-02-15', '2026-03-15'], description: 'ISO dates (YYYY-MM-DD)' })
  @IsArray()
  @IsDateString({}, { each: true })
  departureDates!: string[];

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  availableSeats!: number;
}
