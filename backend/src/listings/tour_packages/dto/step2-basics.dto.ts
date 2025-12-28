import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class Step2BasicsDto {
  @ApiProperty({ example: 'Rocky Mountain Hiking Expedition' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '5-day guided hiking adventure through the Rockies.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 5, description: 'Number of days' })
  @IsInt()
  @Min(1)
  duration!: number;

  @ApiProperty({ example: 1299.99 })
  @IsNumber()
  basePrice!: number;

  @ApiProperty({ example: 12 })
  @IsInt()
  @Min(1)
  maxSeats!: number;
}
