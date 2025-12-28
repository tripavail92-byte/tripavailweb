import { IsIn, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsIn(['phone', 'email'])
  channel!: 'phone' | 'email';

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @Length(4, 6)
  code!: string;
}
