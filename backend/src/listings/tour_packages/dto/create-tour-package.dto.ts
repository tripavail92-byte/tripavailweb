import { IsString, IsNotEmpty, IsNumber, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTourPackageDto {
  @ApiProperty({ example: 'ADVENTURE' })
  @IsString()
  @IsNotEmpty()
  tripType!: string;

  @ApiProperty({ example: 'Island Hopping' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '3-day guided tour across islands.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  duration!: number; // days

  @ApiProperty({ example: 499.5 })
  @IsNumber()
  basePrice!: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  maxSeats!: number;
}
