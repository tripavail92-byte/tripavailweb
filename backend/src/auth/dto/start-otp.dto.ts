import { IsIn, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class StartOtpDto {
  @IsIn(['phone', 'email'])
  channel!: 'phone' | 'email';

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  purpose!: 'login';
}
