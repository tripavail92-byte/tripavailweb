import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class PickupInputDto {
  @ApiProperty({ example: 'Denver' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'Denver International Airport - Arrivals Gate' })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({ example: 39.8561 })
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: -104.6737 })
  @IsNumber()
  longitude!: number;
}

export class Step4PickupsDto {
  @ApiProperty({ type: [PickupInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PickupInputDto)
  pickups!: PickupInputDto[];
}
