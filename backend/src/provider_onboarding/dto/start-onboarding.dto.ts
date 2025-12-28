import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartOnboardingDto {
  @ApiProperty({
    enum: ['HOTEL_MANAGER', 'TOUR_OPERATOR'],
    description: 'Type of provider to onboard as',
  })
  @IsEnum(['HOTEL_MANAGER', 'TOUR_OPERATOR'])
  @IsNotEmpty()
  providerType!: 'HOTEL_MANAGER' | 'TOUR_OPERATOR';
}
