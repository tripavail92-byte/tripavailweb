import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HotelStep7ReviewDto {
  @ApiProperty({ example: true, description: 'Accept terms and conditions' })
  @IsBoolean()
  acceptTerms!: boolean;

  @ApiProperty({ example: false, description: 'Opt-in for marketing communications' })
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}
