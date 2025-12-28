import { IsEnum } from 'class-validator';
import { ProviderType } from '@prisma/client';

export class StartPartnerDto {
  @IsEnum(ProviderType)
  providerType!: ProviderType;

  // Temporary: accept userId until auth guard is added
  userId!: string;
}
