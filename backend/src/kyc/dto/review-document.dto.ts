import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  REQUEST_RESUBMIT = 'REQUEST_RESUBMIT',
}

export class ReviewDocumentDto {
  @ApiProperty({
    enum: ReviewAction,
    description: 'Review action to perform',
    example: 'APPROVE',
  })
  @IsEnum(ReviewAction)
  action!: ReviewAction;

  @ApiProperty({
    description: 'Review notes (required for REJECT/REQUEST_RESUBMIT)',
    required: false,
    example: 'Document is blurry, please resubmit a clearer version',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
