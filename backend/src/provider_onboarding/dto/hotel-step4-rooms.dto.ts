import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  Min,
  Max,
  MinLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RoomTypeDto {
  @ApiProperty({ example: 'Deluxe Ocean View' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 2, description: 'Guest capacity' })
  @IsInt()
  @Min(1)
  @Max(8)
  capacity!: number;

  @ApiProperty({ example: '1 King Bed' })
  @IsString()
  @IsNotEmpty()
  bedConfig!: string;

  @ApiProperty({ example: 299.99, description: 'Base price per night' })
  @IsNumber()
  @Min(0)
  basePrice!: number;

  @ApiProperty({ example: 20, description: 'Total units available' })
  @IsInt()
  @Min(1)
  totalUnits!: number;
}

export class HotelStep4RoomsDto {
  @ApiProperty({ type: [RoomTypeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomTypeDto)
  rooms!: RoomTypeDto[];
}
