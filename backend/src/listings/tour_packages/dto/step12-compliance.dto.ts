import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class Step12ComplianceDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  complianceTermsAccepted!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  complianceLiabilityAccepted!: boolean;
}
