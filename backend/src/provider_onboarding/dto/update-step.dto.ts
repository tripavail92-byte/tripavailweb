import { IsNumber, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStepDto {
  @ApiProperty({
    description: 'Step number (1-14)',
    minimum: 1,
    maximum: 14,
  })
  @IsNumber()
  @Min(1)
  @Max(14)
  step!: number;

  @ApiProperty({
    description: 'Step data (varies by step)',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  data!: any;
}
