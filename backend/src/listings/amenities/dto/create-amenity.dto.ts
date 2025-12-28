import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAmenityDto {
  @ApiProperty({ example: 'Free WiFi' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Room', required: false })
  @IsString()
  @IsOptional()
  category?: string;
}
