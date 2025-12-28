import { IsString, IsNotEmpty, IsNumber, Min, Max, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HotelStep3LocationDto {
  @ApiProperty({ example: '123 Beach Boulevard' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  streetAddress!: string;

  @ApiProperty({ example: 'Miami' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'Florida' })
  @IsString()
  @IsNotEmpty()
  stateProvince!: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ example: '33139' })
  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @ApiProperty({ example: 25.7617, description: 'Latitude coordinate' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: -80.1918, description: 'Longitude coordinate' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}
