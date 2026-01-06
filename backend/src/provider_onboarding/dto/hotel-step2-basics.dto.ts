import { IsString, IsNotEmpty, IsEmail, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PropertyType {
  HOTEL = 'HOTEL',
  MOTEL = 'MOTEL',
  RESORT = 'RESORT',
  INN = 'INN',
}

export class HotelStep2BasicsDto {
  @ApiProperty({ example: 'Sunset Resort & Spa' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  hotelName!: string;

  @ApiProperty({ enum: PropertyType, example: 'HOTEL' })
  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @ApiProperty({ example: 5, description: 'Star rating 1-5' })
  @IsNotEmpty()
  starRating!: number;

  @ApiProperty({ example: 'Luxury beachfront hotel with world-class amenities' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  description!: string;

  @ApiProperty({ example: 'contact@sunsetresort.com' })
  @IsEmail()
  @IsNotEmpty()
  contactEmail!: string;

  @ApiProperty({ example: '+1-555-0123' })
  @IsString()
  @IsNotEmpty()
  contactPhone!: string;
}
