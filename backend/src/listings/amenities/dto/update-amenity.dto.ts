import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAmenityDto {
  @ApiPropertyOptional({ example: 'Free WiFi' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Room' })
  @IsString()
  @IsOptional()
  category?: string;
}
